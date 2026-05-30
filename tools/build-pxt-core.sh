#!/usr/bin/env bash
# Rebuild pxt-core's CLI bundle (built/pxt.js + built/*.js) from its TypeScript
# sources. Needed because pxt-bitsflow relies on local edits to pxt-core
# (the `make` build engine, VM emit fixes) that must be compiled into built/.
#
# Pure tsc + concat — no gulp, no webapp/css build — so it runs identically on a
# Windows host or inside the Linux container.
#
#   usage:  build-pxt-core.sh [path-to-pxt]   (default: /work/pxt, else ../pxt)
set -euo pipefail

PXT="${1:-}"
if [ -z "$PXT" ]; then
    if [ -d /work/pxt ]; then PXT=/work/pxt
    else PXT="$(cd "$(dirname "$0")/../../pxt" && pwd)"; fi
fi
cd "$PXT"
echo "==> rebuilding pxt-core CLI in $PXT"

# The common-sim string-extraction step typechecks against the standard TypeScript
# lib.*.d.ts files at built/. A partial pxt-core build (this script) doesn't run the
# full gulp pipeline that copies them, so `pxt serve`/`buildtarget` would spew
# "TS6053: lib.dom.d.ts not found" + "Cannot find global type" noise. Copy them from the
# TypeScript the pxt compiler bundles so the typecheck is clean.
echo "  copying lib.*.d.ts -> built/"
cp node_modules/typescript/lib/lib.*.d.ts built/ 2>/dev/null || true

TSC="node node_modules/typescript/bin/tsc"
for p in pxtlib pxtcompiler pxtpy pxtsim cli; do
    echo "  tsc -p $p"
    $TSC -p "$p/tsconfig.json"
done

echo "  concat built/pxt.js"
node -e '
const fs = require("fs");
const files = [
  "pxtcompiler/ext-typescript/lib/typescript.js",
  "built/pxtlib.js",
  "built/pxtcompiler.js",
  "built/pxtpy.js",
  "built/pxtsim.js",
  "built/cli.js",
];
const header = `
        "use strict";
        // make sure TypeScript does not overwrite our module.exports
        global.savedModuleExports = module.exports;
        module.exports = null;
    `;
const out = header + files.map(f => fs.readFileSync(f, "utf8")).join("\n");
fs.writeFileSync("built/pxt.js", out);
console.log("  wrote built/pxt.js (" + out.length + " bytes)");
'

# Regenerate the WEBAPP bundles too (mirrors the gulp pxtapp/pxtworker tasks). The
# editor (pxt serve) compiles in the browser using these; the prebuilt built/web copies
# are stale and miss our pxtlib (make engine) + pxtcompiler (backvm .pxt64) fixes.
echo "  concat built/web/pxtapp.js + pxtworker.js"
node -e '
const fs = require("fs");
const cat = (files, header) => (header||"") + files.map(f => fs.readFileSync(f, "utf8")).join("\n");
const lzma = "node_modules/lzma/src/lzma_worker-min.js";
const purify = "node_modules/dompurify/dist/purify.min.js";
const fuse = "node_modules/fuse.js/dist/fuse.min.js";
const ts = "pxtcompiler/ext-typescript/lib/typescript.js";
// pxtapp.js: main-thread editor bundle (contains pxtlib cpp.ts -> the make-engine fix)
fs.writeFileSync("built/web/pxtapp.js",
  cat([lzma, purify, "built/pxtlib.js", "built/pxtsim.js"]));
// pxtworker.js: compile worker (contains pxtcompiler backvm -> correct .pxt64 emit)
fs.writeFileSync("built/web/pxtworker.js",
  cat([ts, fuse, lzma, purify, "built/pxtlib.js", "built/pxtcompiler.js", "built/pxtpy.js"], "\"use strict\";\n"));
console.log("  wrote built/web/pxtapp.js + pxtworker.js");
'
echo "==> pxt-core CLI + webapp bundles rebuilt."
