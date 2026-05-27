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
tools/build-vm-runtime.sh   build the native VM (pxt-vm-cli) on macOS and run a .pxt64
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
