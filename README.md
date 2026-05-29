# pxt-bitsflow — a MakeCode (PXT) target for the PXT VM bytecode

A MakeCode target configured to compile programs to the **PXT VM bytecode** (`.pxt64`)
— `compile.isNative: true`, `compile.nativeType: "vm"`. Unlike a native ARM target (which
links into a board's firmware) or a JS target (which only runs in the browser sim), this
target emits portable VM bytecode that a small C++ interpreter (`pxt-vm-cli`, from
`pxt-common-packages/libs/core---vm`) executes on any platform.

## What's here

```
pxtarget.json          target config: isNative:true, nativeType:"vm", hasHex:true
package.json           pxt-core + pxt-common-packages deps
node_modules/          symlinks: pxt-core -> ../pxt, pxt-common-packages, typescript
libs/core/             corepkg: chains to pxt-common-packages core---vm (VM interpreter)
                       + base (language runtime). dalpatch.d.ts adds a few DAL constants.
libs/base              symlink -> pxt-common-packages/libs/base (language dependency)
libs/blocksprj/        Blocks "New Project" template
libs/tsprj/            JavaScript/Python template
projects/vmtest/       a sample program (forever + console.log + pause)
projects/counter/      a richer sample (variables, math, conditionals)
tools/build-vm-runtime.sh   build the native VM (pxt-vm-cli) on the host and run a .pxt64
tools/build-pxt-core.sh     recompile pxt-core's CLI bundle (pure tsc) — used by Docker
tools/docker-vm.ps1         Windows one-command build+run, fully inside Docker
docker/Dockerfile           node:20 + gcc/make + pxt launcher (the portable VM build env)
docker/entrypoint.sh        in-container: fix symlinks, (re)build pxt-core, build + run
```

## How the VM target is wired

- **`nativeType: "vm"`** selects the VM bytecode backend (`backvm.ts` `vmEmit`). The
  compiler emits a `.pxt64` image (sections: info header with the `\nPXT64\n` magic,
  functions, vtables, string/number literals, opcode map).
- **The core** chains `core---vm → core---linux → core → base` via PXT's recursive
  `additionalFilePath` (nodeutil `readPkgConfig`). `core---vm` supplies the VM
  interpreter C++; `base` supplies the language runtime (`pxt.cpp`, `gc.cpp`, `loops`,
  `control`, `console`, …). `base` is a real dependency (so its enums/shims don't
  duplicate the platform's). `libs/core/dalpatch.d.ts` adds `DAL` constants the base
  runtime needs that the linux variant's committed `dal.d.ts` lacks.
- **Blocks** are auto-generated from `//% block=` annotations; **Python** is the built-in
  TS↔Py converter (`appTheme.python`).

## Run the editor

```bash
cd pxt-bitsflow
pxt serve            # open the printed http://localhost:3232/#... URL
```

`pxt buildtarget` and `pxt serve` work: the editor boots with Blocks / JavaScript /
Python and the `target.js` carries `"nativeType":"vm"`, `"isNative":true`.

### Simulator (console)

A minimal in-browser simulator (`sim/`) runs the program (compiled to JS) and shows
`console.log` output in the simulator pane (and the editor's Console tab). It's
deliberately tiny: the scheduler/event-loop/GC come from pxt-core's `pxsim`; `sim/
simulator.ts` only adds a board + the shims the base language uses
(`loops.forever`/`loops.pause`, `control.__log` → the on-screen console). Example:

```ts
basic.forever(function () {
    console.log("hello from the sim")
    basic.pause(500)
})
```


## Run on Windows with Docker (maximum portability)

The host needs **only Docker Desktop** — no Node, gcc, or make. Everything (the
TS→bytecode compile, the C++ runtime build, and running the VM) happens inside a
Linux container. Both `pxt` (pxt-core) and `pxt-bitsflow` must sit side-by-side
under the same parent folder (e.g. `C:\Workshop\makecode\`), which is bind-mounted
into the container at `/work`.

```powershell
# from the pxt-bitsflow folder — builds the image once, then builds + runs the program
./tools/docker-vm.ps1                                  # defaults: projects/vmtest, 3s
./tools/docker-vm.ps1 -Project projects/vmtest -Seconds 5
./tools/docker-vm.ps1 -Rebuild                         # force-rebuild the image
```

Expected tail:

```
==> running: built/make/bld-x86_64-pc-linux/pxt-vm-cli-linux built/binary.pxt64
[       0] image loaded
[       3] Validation OK
[      11] start main loop
hello from PXT VM
hello from PXT VM
...
```

The sample is a `forever` loop, so it never exits — the wrapper stops it after
`-Seconds`. Pass `-Seconds 0` (or `RUN_SECONDS=0`) to run until it exits / Ctrl-C.

Equivalent raw Docker commands:

```powershell
docker build -t pxt-bitsflow-vm .\docker
docker run --rm -e RUN_SECONDS=3 -v C:\Workshop\makecode:/work pxt-bitsflow-vm projects/vmtest
```

**How it works** (`docker/Dockerfile`, `docker/entrypoint.sh`):
- Base `node:20-bookworm` + `build-essential` (gcc/make) + the tiny `pxt` launcher.
- The entrypoint recreates `node_modules/pxt-core` and `libs/base` as native
  *relative* symlinks inside the mount (Windows symlinks don't survive a bind
  mount reliably; relative targets stay valid on the host too).
- If `pxt-core`'s `built/` predates the local edits (the `make` build engine), it
  is recompiled with `tools/build-pxt-core.sh` (pure `tsc` — no gulp/webapp build).
- Then `pxt build --localbuild` runs inside Linux: the `make` engine compiles the
  C++ runtime to `pxt-vm-cli-linux` and the program to `binary.pxt64`, which is run.

> Build artifacts land under `projects/<proj>/built/` on the host (gitignored) and
> are cached between runs, so re-runs only recompile what changed.

## Program a real RP2040 — blink an LED from Blocks

This target also builds a **bare-metal RP2040 firmware** that embeds the PXT VM and runs
your compiled `.pxt64` on the chip. You write the program in Blocks/JS/Python (e.g. the
`led` blocks below), and the firmware blinks a real LED.

### 1. Write the program (Blocks → `led`)

A small **LED** block category is built into the core (`libs/core/led.ts` + `led.cpp`):

```ts
basic.forever(function () {
    led.toggle()
    basic.pause(500)
})
```

`led.on()`, `led.off()`, `led.toggle()` drive a GPIO. `projects/blink` is this program.

### 2. Wire the LED

External LED on **GPIO 15** (default; change `BITSFLOW_LED_PIN` in `libs/core/led.cpp`):

```
GPIO15 ──[ ~330Ω ]──▶|── GND
                     LED
```

### 3. Build the firmware (.uf2) — fully in Docker

Host needs only Docker (arm-none-eabi + pico-sdk live in the `pxt-bitsflow-pico` image):

```powershell
./tools/build-rp2040.ps1                 # project defaults to "blink"
./tools/build-rp2040.ps1 -Project blink  # -> firmware/rp2040/build/bitsflow_vm_pico.uf2
```

Three stages: compile the project to `binary.pxt64` + `pxtapp/` C++, embed the image into
`firmware/rp2040/generated/vm_image.c`, then compile the firmware with the pico-sdk.

### 4. Flash

Hold **BOOTSEL** while plugging in the Pico, then copy `bitsflow_vm_pico.uf2` onto the
`RPI-RP2` drive (or `picotool load`). The board reboots and the LED blinks twice a second.
`console.log` output is available over USB serial.

### How the VM runs on a 32-bit MCU

The VM has two value models: **PXT64** (requires 64-bit pointers — unusable on RP2040) and
**PXT32** (assumes a <256 MB address space — flash `<0x10000000`, RAM `0x20000000`). The
RP2040's XIP flash at `0x10000000` breaks PXT32's read-only / vtable assumptions, so the
firmware build defines `PXT_RP2040`, which reuses PXT64's `gcBase`-relative GC model while
keeping 32-bit values (patches in `tools/patch-vm-sources.js`), with a 128 KB GC heap to fit
SRAM. `firmware/rp2040/src/rp2040_platform.cpp` backs the scheduler clock/sleep with the
RP2040 timer; `vmcache.cpp` (on-disk cache) is excluded.

## Compile to VM bytecode + build the runtime + run — one pass, no Docker

```bash
cd projects/vmtest
PXT_NODOCKER=1 pxt build --localbuild     # emits binary.pxt64 AND builds pxt-vm-cli
built/make/bld-*/pxt-vm-cli built/binary.pxt64    # run the bytecode on the VM
# or simply:  tools/build-vm-runtime.sh projects/vmtest
```

Expected output (the sample is a `forever` loop printing every 500ms):

```
[       0] image loaded
[       0] Validation OK
[       0] start main loop
hello from PXT VM
hello from PXT VM
...
```

`pxt build` runs the C++ runtime build **on the host** via the new `make` build engine
(`compileService.buildEngine: "make"`), so a single command produces both the `.pxt64`
bytecode and the native `pxt-vm-cli` that executes it. `built/binary.asm` shows the VM
image (`.startaddr 0x0`, the `\nPXT64\n` magic, the opcodes).

## Status — working end to end ✅

| Piece | State |
|-------|-------|
| VM-configured target builds (`pxt buildtarget`) | ✅ |
| Editor serves (`pxt serve`): Blocks / JS / Python | ✅ |
| Program → `.pxt64` VM bytecode (local) | ✅ |
| Native VM runtime `pxt-vm-cli` builds on macOS (clang) | ✅ Mach-O arm64 |
| One-pass integrated build (bytecode + runtime, no Docker) | ✅ via the `make` engine |
| `pxt-vm-cli` validates **and executes** the bytecode | ✅ `Validation OK` + program output |

## Changes this required (outside the target)

The PXT VM backend had not been driven host-locally before; getting it working needed:

**pxt-core** (the host build engine + VM-emit fixes):
- `cli/buildengine.ts` — new **`make`** build engine: runs `make build-one` on the host
  (no Docker), so `getHexInfoAsync`/`buildHexAsync` build the runtime locally.
- `pxtlib/cpp.ts` — treat `buildEngine: "make"` like `dockermake` for the C++ source
  layout (`/pxtapp/`, not the yotta layout).
- `pxtcompiler/emitter/backvm.ts` — do **not** embed the source map in the loadable VM
  image (the VM validates every section to the end of the file; a raw srcmap trailer made
  it invalid). Opt back in with `compile.vmEmbedSourceMap`. Also pad the image to 8 bytes
  (not 32) so there's no trailing zero region past the last section.
- `localtypings/pxtarget.d.ts` — add the `compile.vmEmbedSourceMap` flag.

**pxt-common-packages** (genuine 64-bit / host-runtime fixes):
- `libs/core---vm/vm.cpp` — a pointer cast used `uint32_t`, truncating 64-bit pointers;
  changed to `uintptr_t`.
- `libs/core---linux/platform.cpp` — `sendSerial` was a no-op; write to stdout so
  `console.log` is visible on the host VM.

**this target**:
- `libs/core/vmscreen.cpp` — a no-op `updateScreen` (the VM has no display package).
