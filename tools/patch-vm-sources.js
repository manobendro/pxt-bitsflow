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

function patch(file, marker, from, to) {
    const p = path.join(libs, file);
    let s = fs.readFileSync(p, "utf8");
    if (s.includes(marker)) { console.log(`  [ok]    ${file} already patched`); return; }
    if (!s.includes(from)) { console.log(`  [skip]  ${file}: target text not found (upstream changed?)`); return; }
    fs.writeFileSync(p, s.replace(from, to));
    console.log(`  [patch] ${file}`);
}

patch(
    "core---linux/platform.cpp",
    "STDOUT_FILENO",
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
