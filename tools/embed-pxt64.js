#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const input = process.argv[2] || path.join(root, "projects/vmtest/built/binary.pxt64");
const output = process.argv[3] || path.join(root, "firmware/rp2040/generated/vm_image.c");
const bytes = [...fs.readFileSync(input)];
const body = bytes.map((b, i) => `${i % 12 === 0 ? "\n    " : ""}0x${b.toString(16).padStart(2, "0")}`).join(", ");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `#include <stdint.h>\n\nconst unsigned char bitsflow_vm_image[] __attribute__((aligned(8))) = {${body}\n};\nconst unsigned int bitsflow_vm_image_len = ${bytes.length};\n`);
console.log(`embedded ${bytes.length} bytes -> ${output}`);
