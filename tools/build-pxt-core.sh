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
echo "==> pxt-core CLI rebuilt."
