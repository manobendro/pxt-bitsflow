/// <reference path="../node_modules/pxt-core/built/pxtlib.d.ts"/>
/// <reference path="../node_modules/pxt-core/built/pxtcompiler.d.ts"/>
/// <reference path="../node_modules/pxt-core/localtypings/pxteditor.d.ts"/>

// Editor extension: customizes the Download button for the RP2040.
//
// The VM firmware is prebuilt and bundled at sim/public/firmware.uf2. The editor
// compiles the program to .pxt64 bytecode in the browser; here we wrap that bytecode
// into a UF2 placed at the fixed flash region (0x10100000) with a "PXTB"+size header,
// and offer two Download options:
//   - Firmware + program : firmware.uf2 ++ bytecode.uf2  (flash once on a fresh board)
//   - Program only       : bytecode.uf2                  (update a board that has the firmware)
// Everything happens in the browser.
namespace pxt.editor {
    const FLASH_ADDR = 0x10100000;     // must match BYTECODE_ADDR in rp2040_main.cpp
    const FAMILY_RP2040 = 0xe48bff56;
    const PXT64_OUTFILE = "binary.pxt64";

    let projectView: IProjectView;
    let downloadMode = "combined"; // "combined" | "program"

    function b64ToBytes(b64: string): Uint8Array {
        const bin = atob(b64);
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; ++i) out[i] = bin.charCodeAt(i);
        return out;
    }

    // Wrap raw .pxt64 bytes into a UF2 at FLASH_ADDR, prefixed with "PXTB" + uint32 LE size.
    function bytecodeToUF2(pxt64: Uint8Array): Uint8Array {
        const PAYLOAD = 256;
        const n = pxt64.length;
        const payload = new Uint8Array(8 + n);
        payload[0] = 0x50; payload[1] = 0x58; payload[2] = 0x54; payload[3] = 0x42; // "PXTB"
        payload[4] = n & 0xff; payload[5] = (n >> 8) & 0xff; payload[6] = (n >> 16) & 0xff; payload[7] = (n >> 24) & 0xff;
        payload.set(pxt64, 8);

        const numBlocks = Math.ceil(payload.length / PAYLOAD);
        const out = new Uint8Array(numBlocks * 512);
        const dv = new DataView(out.buffer);
        for (let i = 0; i < numBlocks; ++i) {
            const o = i * 512;
            dv.setUint32(o + 0, 0x0a324655, true);     // UF2 magic start 0
            dv.setUint32(o + 4, 0x9e5d5157, true);     // UF2 magic start 1
            dv.setUint32(o + 8, 0x00002000, true);     // flags: familyID present
            dv.setUint32(o + 12, FLASH_ADDR + i * PAYLOAD, true);
            dv.setUint32(o + 16, PAYLOAD, true);       // payload size (zero-padded last block)
            dv.setUint32(o + 20, i, true);             // block number
            dv.setUint32(o + 24, numBlocks, true);     // total blocks
            dv.setUint32(o + 28, FAMILY_RP2040, true); // familyID
            const start = i * PAYLOAD;
            out.set(payload.subarray(start, Math.min(start + PAYLOAD, payload.length)), o + 32);
            dv.setUint32(o + 508, 0x0ab16f30, true);   // UF2 magic end
        }
        return out;
    }

    function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
        const r = new Uint8Array(a.length + b.length);
        r.set(a, 0);
        r.set(b, a.length);
        return r;
    }

    function downloadBytes(bytes: Uint8Array, filename: string) {
        const blob = new Blob([bytes], { type: "application/x-uf2" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function fetchFirmwareAsync(): Promise<Uint8Array> {
        return fetch("/firmware.uf2")
            .then(r => { if (!r.ok) throw new Error("firmware.uf2 not found (" + r.status + ")"); return r.arrayBuffer(); })
            .then(buf => new Uint8Array(buf));
    }

    function deployAsync(resp: pxtc.CompileResult): Promise<void> {
        const mode = downloadMode;
        downloadMode = "combined"; // reset so the main button defaults to combined
        const b64 = resp && resp.outfiles && resp.outfiles[PXT64_OUTFILE];
        if (!b64) {
            pxt.log("bitsflow: no " + PXT64_OUTFILE + " in compile output");
            return Promise.resolve();
        }
        const bytecodeUf2 = bytecodeToUF2(b64ToBytes(b64));

        if (mode == "program") {
            downloadBytes(bytecodeUf2, "bitsflow-program.uf2");
            return Promise.resolve();
        }
        return fetchFirmwareAsync()
            .then(fw => downloadBytes(concatBytes(fw, bytecodeUf2), "bitsflow-firmware-program.uf2"))
            .catch(e => {
                pxt.log("bitsflow: firmware.uf2 unavailable; downloading program only. " + e);
                downloadBytes(bytecodeUf2, "bitsflow-program.uf2");
            });
    }

    function getDownloadMenuItems(): any[] {
        return [
            {
                role: "menuitem",
                icon: "xicon file-download",
                text: "Firmware + program (.uf2)",
                onClick: () => { downloadMode = "combined"; if (projectView) projectView.compile(); }
            },
            {
                role: "menuitem",
                icon: "file outline",
                text: "Program only (.uf2)",
                onClick: () => { downloadMode = "program"; if (projectView) projectView.compile(); }
            }
        ];
    }

    // --- UI tweaks injected as a stylesheet -------------------------------------
    // pxt-core's prebuilt webapp applies theme color variables but loads no target CSS,
    // so we inject our own <style> here (runs in the editor document on load).
    // Edit BITSFLOW_CSS to add more editor tweaks.
    const BITSFLOW_CSS = `
/* Download "expand" menu z-index fix.
   #editortools is z-index 41 (@blocklyToolboxZIndex+1) but the Blockly toolbox is
   z-index 40 and its FLYOUT panel also stacks above the bar, so the download dropdown
   menu (inside the bar) was painted UNDER the toolbox. Raise the whole bar above the
   toolbox/flyout, and pin the open menu on top — still well below modals (@1000). */
#editortools {
    z-index: 200 !important;
}
#editortools .ui.dropdown .menu,
#editortools .ui.dropdown.active .menu,
#editortools .ui.dropdown .menu.visible {
    z-index: 300 !important;
}

/* Consistent spacing for the download dropdown items. */
#editortools .ui.dropdown .menu > .item {
    padding: 0.7em 1em !important;
    white-space: nowrap;
}
`;

    function injectCss(): void {
        try {
            if (typeof document === "undefined") return;
            const id = "bitsflow-ui-overrides";
            if (document.getElementById(id)) return;
            const style = document.createElement("style");
            style.id = id;
            style.textContent = BITSFLOW_CSS;
            (document.head || document.documentElement).appendChild(style);
        } catch (e) {
            pxt.log("bitsflow: CSS inject failed " + e);
        }
    }

    // Register with the editor framework (assign rather than redeclare the framework hook).
    (pxt.editor as any).initExtensionsAsync = function (opts: ExtensionOptions): Promise<ExtensionResult> {
        projectView = opts.projectView;
        injectCss();
        pxt.log("bitsflow editor extension loaded");
        const res: ExtensionResult = {
            deployAsync: deployAsync,
            getDownloadMenuItems: getDownloadMenuItems
        };
        return Promise.resolve(res);
    };
}
