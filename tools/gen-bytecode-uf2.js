#!/usr/bin/env node
// Wrap a compiled .pxt64 into an RP2040 UF2 placed at the fixed bytecode flash region
// (0x10100000), prefixed with an 8-byte header: "PXTB" + uint32 little-endian size.
// (Matches BYTECODE_ADDR / the header check in firmware/rp2040/src/rp2040_main.cpp.)
//
// A "combined" (firmware + program) UF2 is just the firmware UF2 bytes followed by this
// one — each 512-byte UF2 block carries its own target address.
//
//   usage: node tools/gen-bytecode-uf2.js [input.pxt64] [output.uf2]
"use strict";
const fs = require("fs");
const path = require("path");

const FLASH_ADDR = 0x10100000;          // must match BYTECODE_ADDR in rp2040_main.cpp
const FAMILY_RP2040 = 0xe48bff56;
const UF2_MAGIC0 = 0x0a324655, UF2_MAGIC1 = 0x9e5d5157, UF2_MAGIC_END = 0x0ab16f30;
const UF2_FLAG_FAMILY = 0x00002000;
const PAYLOAD = 256;

const root = path.resolve(__dirname, "..");
const input = process.argv[2] || path.join(root, "projects/blink/built/binary.pxt64");
const output = process.argv[3] || path.join(root, "firmware/rp2040/build/bytecode.uf2");

if (!fs.existsSync(input)) {
    console.error(`ERROR: .pxt64 not found: ${input}`);
    process.exit(1);
}
const pxt64 = fs.readFileSync(input);

const header = Buffer.alloc(8);
header.write("PXTB", 0, "ascii");
header.writeUInt32LE(pxt64.length, 4);
const payload = Buffer.concat([header, pxt64]);

const numBlocks = Math.ceil(payload.length / PAYLOAD);
const out = Buffer.alloc(numBlocks * 512); // zero-filled: last block is zero-padded
for (let i = 0; i < numBlocks; i++) {
    const b = out.subarray(i * 512, (i + 1) * 512);
    b.writeUInt32LE(UF2_MAGIC0, 0);
    b.writeUInt32LE(UF2_MAGIC1, 4);
    b.writeUInt32LE(UF2_FLAG_FAMILY, 8);
    b.writeUInt32LE(FLASH_ADDR + i * PAYLOAD, 12);
    b.writeUInt32LE(PAYLOAD, 16);          // payloadSize (zero-padded on last block)
    b.writeUInt32LE(i, 20);                // blockNo
    b.writeUInt32LE(numBlocks, 24);        // numBlocks
    b.writeUInt32LE(FAMILY_RP2040, 28);    // familyID
    payload.copy(b, 32, i * PAYLOAD, i * PAYLOAD + PAYLOAD);
    b.writeUInt32LE(UF2_MAGIC_END, 508);
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, out);
console.log(`wrote ${output} (${numBlocks} UF2 blocks, ${payload.length} bytes @ 0x${FLASH_ADDR.toString(16)})`);
