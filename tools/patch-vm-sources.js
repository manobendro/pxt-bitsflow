#!/usr/bin/env node
// Idempotently apply the two host-VM C++ fixes to pxt-common-packages. These live
// under node_modules (gitignored), so a fresh `npm install` reverts them — this
// script re-applies them. Run automatically by docker/entrypoint.sh.
//
//   1. core---linux/platform.cpp : sendSerial() is a no-op upstream; route it to
//      stdout so console.log is visible on the host VM.
//   2. core---vm/vm.cpp          : a pointer was cast through uint32_t, truncating
//      64-bit pointers (gcc errors on it). Use uintptr_t.
"use strict";
const fs = require("fs");
const path = require("path");

const libs = process.argv[2] ||
    path.resolve(__dirname, "../node_modules/pxt-common-packages/libs");

// If pxt-common-packages already ships its own RP2040 support (e.g. a cloned dev repo
// with a native port), these legacy patches — written for the npm release that lacked
// RP2040 — would conflict (duplicate #if branches). Detect and skip entirely.
try {
    const sched = fs.readFileSync(path.join(libs, "core---vm/scheduler.cpp"), "utf8");
    if (sched.includes("PXT_RP2040")) {
        console.log("pxt-common-packages already has native RP2040 support — skipping legacy VM patches.");
        process.exit(0);
    }
} catch (e) { /* fall through to patching */ }

function patch(file, marker, from, to) {
    const p = path.join(libs, file);
    let s = fs.readFileSync(p, "utf8");
    if (s.includes(marker)) { console.log(`  [ok]    ${file} already patched`); return; }
    if (!s.includes(from)) { console.log(`  [skip]  ${file}: target text not found (upstream changed?)`); return; }
    fs.writeFileSync(p, s.replace(from, to));
    console.log(`  [patch] ${file}`);
}

patch(
    // marker "stdout": some pxt-common-packages versions already route sendSerial to
    // stdout (fwrite/STDOUT_FILENO) — treat those as already patched.
    "core---linux/platform.cpp",
    "stdout",
`void sendSerial(const char *data, int len) {
    /*
    if (!serial) {
        serial = new codal::_mbed::Serial(USBTX, NC);
        serial->baud(9600);
    }
    serial->send((uint8_t*)data, len);
    */
}`,
`void sendSerial(const char *data, int len) {
    // Host VM: route serial/console output to stdout so console.log is visible.
    if (len > 0) {
        (void)write(STDOUT_FILENO, data, len);
    }
}`
);

patch(
    "core---vm/vm.cpp",
    "(uintptr_t)vmImg->dataEnd",
    "(const uint32_t *)((uint32_t)vmImg->dataEnd & ~0xf);",
    "(const uint32_t *)((uintptr_t)vmImg->dataEnd & ~(uintptr_t)0xf);"
);

// --- RP2040 (bare-metal) port -------------------------------------------------
// The PXT VM has two value models: PXT64 (needs sizeof(void*)==8, so unusable on the
// 32-bit RP2040) and PXT32 (assumes a <256MB address space — flash <0x10000000, RAM at
// 0x20000000). The RP2040's XIP flash sits at 0x10000000, which breaks PXT32's read-only
// detection and a vtable sanity check. These patches route PXT_RP2040 into the existing
// gcBase-relative GC model (used by PXT64) while keeping 32-bit values, and let the heap
// size be tuned to fit ~264KB of SRAM. All under `defined(PXT_RP2040)` so the host build
// (which never defines it) is unaffected.

// 1) GC model: use the fixed xmalloc heap + gcBase-relative PXT_IS_READONLY on RP2040.
patch(
    "core---vm/platform.h",
    "defined(PXT_RP2040)",
    "#if defined(PXT64) || defined(__MINGW32__)",
    "#if defined(PXT64) || defined(__MINGW32__) || defined(PXT_RP2040)"
);
// 2) Make the 1MB default heap overridable (-DPXT_VM_HEAP_ALLOC_BITS=NN) so it fits SRAM.
patch(
    "core---vm/platform.h",
    "#ifndef PXT_VM_HEAP_ALLOC_BITS",
    "// always allocate 1M of heap\n#define PXT_VM_HEAP_ALLOC_BITS 20",
    "// always allocate 1M of heap (override via -DPXT_VM_HEAP_ALLOC_BITS=NN)\n#ifndef PXT_VM_HEAP_ALLOC_BITS\n#define PXT_VM_HEAP_ALLOC_BITS 20\n#endif"
);
// 3) gcAllocBlock: take the xmalloc (not mmap) path on RP2040.
patch(
    "core---vm/scheduler.cpp",
    "defined(PXT_RP2040)",
    "#if defined(PXT64) || defined(__MINGW32__)",
    "#if defined(PXT64) || defined(__MINGW32__) || defined(PXT_RP2040)"
);
// 4) Skip the PXT32 vtable-address assertion (vt & 0xf0000000) — false on RP2040 where
//    flash is 0x10000000 and RAM 0x20000000.
patch(
    "base/pxtbase.h",
    "!defined(PXT_ESP32) && !defined(PXT_RP2040)",
    "#if defined(PXT32) && defined(PXT_VM) && !defined(PXT_ESP32)",
    "#if defined(PXT32) && defined(PXT_VM) && !defined(PXT_ESP32) && !defined(PXT_RP2040)"
);
// 5) Don't include <sys/mman.h> on RP2040 — no mmap on bare metal (GC uses xmalloc).
patch(
    "core---vm/scheduler.cpp",
    "#elif defined(PXT_RP2040)\n// bare metal: no mmap",
    "#ifdef __MINGW32__\n#include <windows.h>\n#else\n#include <sys/mman.h>\n#endif",
    "#ifdef __MINGW32__\n#include <windows.h>\n#elif defined(PXT_RP2040)\n// bare metal: no mmap (GC uses the xmalloc heap path)\n#else\n#include <sys/mman.h>\n#endif"
);
// 6) afterProgramPage(): header declares `unsigned`, scheduler.cpp defines `uint32_t`.
//    On 32-bit ARM newlib these are distinct types (uint32_t == unsigned long) -> clash.
patch(
    "core---vm/scheduler.cpp",
    "unsigned afterProgramPage()",
    "uint32_t afterProgramPage()",
    "unsigned afterProgramPage()"
);
// 7) sleep_core_us(): bare-metal newlib doesn't declare nanosleep. Busy-wait on the VM
//    clock (current_time_us, itself backed by the RP2040 timer) on RP2040 instead.
patch(
    "core---vm/scheduler.cpp",
    "current_time_us() + us",
    "#else\n    struct timespec ts;\n    ts.tv_sec = us / 1000000;\n    ts.tv_nsec = (us % 1000000) * 1000;\n    while (nanosleep(&ts, &ts))\n        ;\n#endif",
    "#elif defined(PXT_RP2040)\n    uint64_t endp = current_time_us() + us;\n    while (current_time_us() < endp)\n        ;\n#else\n    struct timespec ts;\n    ts.tv_sec = us / 1000000;\n    ts.tv_nsec = (us % 1000000) * 1000;\n    while (nanosleep(&ts, &ts))\n        ;\n#endif"
);
// 8) Let pico-sdk provide operator new/delete on RP2040 (it defines its own; the VM's
//    xmalloc-based versions would be a duplicate definition at link time).
patch(
    "core---vm/scheduler.cpp",
    "#ifndef PXT_RP2040 // operator new/delete",
    "void *operator new(size_t size) {\n    return xmalloc(size);\n}\nvoid *operator new[](size_t size) {\n    return xmalloc(size);\n}\n\nvoid operator delete(void *p)THROW {\n    xfree(p);\n}\nvoid operator delete[](void *p) THROW {\n    xfree(p);\n}",
    "#ifndef PXT_RP2040 // operator new/delete\nvoid *operator new(size_t size) {\n    return xmalloc(size);\n}\nvoid *operator new[](size_t size) {\n    return xmalloc(size);\n}\n\nvoid operator delete(void *p)THROW {\n    xfree(p);\n}\nvoid operator delete[](void *p) THROW {\n    xfree(p);\n}\n#endif"
);
// 9) sleep_ms(): header declares `unsigned`, def uses `uint32_t` (== unsigned long on ARM)
//    -> mangling mismatch -> undefined reference. Match the header.
patch(
    "core---vm/scheduler.cpp",
    "void sleep_ms(unsigned ms)",
    "void sleep_ms(uint32_t ms)",
    "void sleep_ms(unsigned ms)"
);
// 10) The dmesg/serial LogQueue is a 128KB static buffer — half of RP2040's 264KB SRAM.
//     Shrink to 4KB on RP2040 so the GC heap fits.
patch(
    "core---vm/target.cpp",
    "#ifdef PXT_RP2040\n#define LOG_QUEUE_SIZE",
    "#define LOG_QUEUE_SIZE (128 * 1024)",
    "#ifdef PXT_RP2040\n#define LOG_QUEUE_SIZE (4 * 1024)\n#else\n#define LOG_QUEUE_SIZE (128 * 1024)\n#endif"
);
