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

You write a program in Blocks/JS/Python and run it on a real Raspberry Pi Pico. The
**VM firmware is built once** and the **program bytecode is flashed separately** to a
fixed flash region — so updating a program never reflashes the firmware.

### Architecture

```
flash 0x10000000  ┌───────────────────────┐
                  │  VM firmware (built     │  built once (pico-sdk). Reads the program
                  │  once, ~235 KB)         │  from the fixed region below and runs it.
flash 0x10100000  ├───────────────────────┤
                  │ "PXTB" + size + .pxt64  │  the program — flash this to update it
                  └───────────────────────┘
```

- The firmware (`firmware/rp2040/`) embeds the PXT VM + a **superset of shims** (built from
  the `projects/firmware` shim-manifest, so one firmware runs any program). At boot it reads
  the header at `0x10100000` (`"PXTB"` magic + `uint32` size), copies the `.pxt64` to RAM,
  and runs it. No program present → fast error blink on GPIO 15.
- The program is a small UF2 placed at `0x10100000`. Because each UF2 block self-addresses,
  **firmware.uf2 ++ bytecode.uf2 = a valid combined UF2** (just a byte concat).

### Built-in device APIs (`libs/core/`)

Each is a small TS block API + a native shim (`ns::fn`) that drives the RP2040 via
pico-sdk on the firmware and logs via DMESG on the host VM:

| Namespace | Blocks | RP2040 backing |
|-----------|--------|----------------|
| `led`      | `on` / `off` / `toggle` | GPIO 15 (`BITSFLOW_LED_PIN`) |
| `pins`     | `digitalReadPin` / `digitalWritePin` / `setPull` (P0–P28) | GPIO |
| `neopixel` | `create` / `createAPA102` / `setPixelColor` / `setPixelBrightness` / `showColor` / `show` / `clear` / `setBrightness` / `rgb` / `colors` | WS2812 via PIO; APA102 bit-banged |
| `spi`      | `init` / `write` / `transfer` / `setFrequency` / `setMode` | `spi0`/`spi1` (auto from SCK pin) |
| `i2c`      | `init` / `setFrequency` / `readBuffer` / `writeBuffer` / `readNumber` / `writeNumber` / `readRegister` | `i2c0`/`i2c1` (auto from SDA pin) |
| `uart`     | `init` / `setBaudRate` / `writeString` / `writeBuffer` / `readBuffer` / `available` | `uart0`/`uart1` (auto from TX pin), separate from `console.log` |

The hardware peripheral instance is selected automatically from the chosen pins (RP2040
pinmux). One active bus per protocol. Example:

```ts
i2c.init(DigitalPin.P4, DigitalPin.P5)
i2c.writeNumber(0x3c, 0x01, NumberFormat.UInt8LE)
const v = i2c.readNumber(0x3c, NumberFormat.UInt8LE)
```

### Write the program (Blocks → `led`)

A small **LED** category is built into the core (`libs/core/led.ts` + `led.cpp`):

```ts
basic.forever(function () {
    led.toggle()
    basic.pause(500)
})
```

`led.on()`, `led.off()`, `led.toggle()` drive a GPIO. `projects/blink` is this program.
Wire an external LED on **GPIO 15** (change `BITSFLOW_LED_PIN` in `libs/core/led.cpp`):

```
GPIO15 ──[ ~330Ω ]──▶|── GND
                     LED
```

### Download from the editor (everything in the browser)

`pxt serve` → write a program → the **Download** dropdown offers two options (editor
extension `editor/extension.ts`, enabled by `appTheme.extendEditor`):

- **Firmware + program (.uf2)** — flash once on a fresh board.
- **Program only (.uf2)** — flash to update the program on a board that already has the firmware.

Both are assembled in the browser: the editor compiles to `.pxt64`, wraps it (header +
UF2 at `0x10100000`) and, for the combined option, prepends the prebuilt
`sim/public/firmware.uf2`. Flash by holding **BOOTSEL** and copying the `.uf2` to the
`RPI-RP2` drive. Serial (`console.log`) is on USB **and** UART0 (GPIO0 TX, 115200).

> The bundled `sim/public/firmware.uf2` is produced once by `tools/build-rp2040.ps1`
> (`-RebuildFirmware`). Rebuild it whenever you change firmware C/patches or add APIs to
> the shim manifest.

### Build from the CLI (no editor) — fully in Docker

Host needs only Docker (arm-none-eabi + pico-sdk live in the `pxt-bitsflow-pico` image):

```powershell
./tools/build-rp2040.ps1                       # firmware (once) + blink program
./tools/build-rp2040.ps1 -Project blink        # -> firmware/rp2040/build/{firmware,bytecode,combined}.uf2
./tools/build-rp2040.ps1 -RebuildFirmware      # force-rebuild the firmware
```

Outputs in `firmware/rp2040/build/`: `firmware.uf2` (also bundled to `sim/public/`),
`bytecode.uf2` (program only), `combined.uf2` (fresh board). `tools/gen-bytecode-uf2.js`
does the `.pxt64` → UF2 wrapping.

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
