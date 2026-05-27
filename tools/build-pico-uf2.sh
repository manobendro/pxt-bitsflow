#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT="${1:-projects/vmtest}"
BUILD_DIR="firmware/rp2040/build"

(cd "$PROJECT" && PXT_NODOCKER=1 pxt build --localbuild --force)
node tools/embed-pxt64.js "$PROJECT/built/binary.pxt64" firmware/rp2040/generated/vm_image.c

: "${PICO_SDK_PATH:?PICO_SDK_PATH must point to pico-sdk}"
cmake -S firmware/rp2040 -B "$BUILD_DIR" -DCMAKE_BUILD_TYPE=MinSizeRel
cmake --build "$BUILD_DIR" -j

UF2="$BUILD_DIR/bitsflow_vm_pico.uf2"
echo "built $UF2"
