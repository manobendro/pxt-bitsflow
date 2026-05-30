#!/usr/bin/env bash
# Compile a project to PXT VM bytecode, build the native pxt-vm-cli, and run it.
# Runs entirely inside the Linux container; the bind-mounted /work holds both
# `pxt` (pxt-core) and `pxt-bitsflow`.
#
#   args:  $1 = project dir relative to pxt-bitsflow (default: projects/vmtest)
#   env :  RUN_SECONDS  how long to run the VM (default 3; 0 = until it exits)
set -euo pipefail

ROOT=/work/pxt-bitsflow
PROJ="${1:-projects/vmtest}"
RUN_SECONDS="${RUN_SECONDS:-3}"

if [ ! -f "$ROOT/pxtarget.json" ]; then
    echo "ERROR: $ROOT/pxtarget.json not found." >&2
    echo "       Mount the makecode workspace at /work (so /work/pxt and" >&2
    echo "       /work/pxt-bitsflow both exist). See tools/docker-vm.ps1." >&2
    exit 1
fi

# Recreate the two cross-directory links as native, RELATIVE Linux symlinks so the
# build resolves regardless of how the host stored them (Windows symlinks do not
# reliably survive a bind mount). Relative targets stay valid on the host too.
# pxt-core / pxt-common-packages / libs/base point at the sibling clones. The host links
# them as Windows JUNCTIONS, which Docker does NOT follow in a bind mount — so the runner
# scripts (tools/*.ps1) bind-mount the sibling clones directly onto these paths in the
# container. We must NEVER rewrite these on the shared mount: doing so would replace the
# host's Windows junction with a Linux symlink and break host `pxt serve`.
ensure_link() {
    local link="$ROOT/$1" tgt="$2" probe="$3"
    [ -e "$link/$probe" ] && return 0                # resolved (bind mount / real dir / good symlink)
    if [ -e "$link" ] || [ -L "$link" ]; then        # present but unresolvable (host junction)
        echo "ERROR: '$1' exists but is not resolvable inside the container." >&2
        echo "       Run via tools/build-rp2040.ps1 / tools/docker-vm.ps1 — they bind-mount" >&2
        echo "       the sibling clones (pxt, pxt-common-packages) into the container." >&2
        exit 1
    fi
    ln -s "$tgt" "$link"                             # truly absent (fresh clone) -> Linux symlink
}
ensure_link "node_modules/pxt-core"            "../../pxt"                  "built/pxt.js"
ensure_link "node_modules/pxt-common-packages" "../../pxt-common-packages" "libs/base/pxt.json"
ensure_link "libs/base" "../node_modules/pxt-common-packages/libs/base"    "pxt.json"

# Re-apply the host-VM C++ fixes (they live under node_modules, which npm install
# reverts). Idempotent — no-op once patched.
echo "==> applying VM C++ source patches"
node "$ROOT/tools/patch-vm-sources.js"

# pxt-bitsflow relies on local pxt-core edits (the `make` build engine, VM emit
# fixes). If built/ predates those edits, recompile the CLI bundle (pure tsc).
if ! grep -q "runHostMakeAsync" /work/pxt/built/buildengine.js 2>/dev/null; then
    echo "==> pxt-core CLI bundle is stale — rebuilding (tsc)…"
    bash "$ROOT/tools/build-pxt-core.sh" /work/pxt
fi

cd "$ROOT/$PROJ"
echo "==> pxt build --localbuild --force   (emits binary.pxt64 + pxtapp via the make engine)"
# --force bypasses built/hexcache (created by `pxt buildtarget` for the editor); without
# it the make engine is skipped and pxtapp/ is never generated for the firmware build.
PXT_NODOCKER=1 pxt build --localbuild --force

if [ -n "${BUILD_ONLY:-}" ]; then
    echo "==> BUILD_ONLY set — skipping VM run (bytecode + pxtapp are built)."
    exit 0
fi

VM="$(ls built/make/bld-*/pxt-vm-cli* 2>/dev/null | head -1 || true)"
PXT64=built/binary.pxt64
if [ -z "$VM" ] || [ ! -x "$VM" ]; then
    echo "ERROR: VM runtime not built (looked for built/make/bld-*/pxt-vm-cli*)." >&2
    exit 1
fi

echo
echo "==> running: $VM $PXT64"
if [ "$RUN_SECONDS" = "0" ]; then
    exec "$VM" "$PXT64"
fi
echo "    (stopping after ${RUN_SECONDS}s — set RUN_SECONDS=0 to run until exit / Ctrl-C)"
echo "------------------------------------------------------------------------"
timeout --preserve-status "${RUN_SECONDS}s" "$VM" "$PXT64" || true
echo "------------------------------------------------------------------------"
echo "==> done."
