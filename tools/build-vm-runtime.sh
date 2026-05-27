#!/usr/bin/env bash
# build-vm-runtime.sh — compile a program to PXT VM bytecode, build the native VM
# runtime, and run the bytecode. The `make` build engine (compileService.buildEngine
# in pxtarget.json) does the C++ build on the host in one pass — no Docker.
#
# Usage:  tools/build-vm-runtime.sh <projectDir>
#   e.g.  tools/build-vm-runtime.sh projects/vmtest
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJ="$(cd "$ROOT/${1:?usage: build-vm-runtime.sh <projectDir>}" && pwd)"

echo "==> pxt build --localbuild  (emits .pxt64 + builds pxt-vm-cli via the make engine)"
( cd "$PROJ" && PXT_NODOCKER=1 pxt build --localbuild )

VM="$(echo "$PROJ"/built/make/bld-*/pxt-vm-cli)"
PXT64="$PROJ/built/binary.pxt64"
[ -x "$VM" ] || { echo "VM runtime not built: $VM" >&2; exit 1; }

echo "==> run: $VM $PXT64"
"$VM" "$PXT64"
