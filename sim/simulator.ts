/// <reference path="../node_modules/pxt-core/built/pxtsim.d.ts"/>

/**
 * Minimal Bitsflow VM simulator: runs the program in the browser (compiled to JS) and
 * shows console output. The cooperative scheduler (forever/pause), event loop and GC
 * come from pxt-core's pxsim runtime; we only supply the board + the handful of shims
 * the base language uses (loops.forever/pause, console output).
 */
namespace pxsim {
    export class BitsflowBoard extends BaseBoard {
        constructor() {
            super();
        }

        initAsync(msg: SimulatorRunMessage): Promise<void> {
            const el = document.getElementById("console");
            if (el) el.textContent = "";
            return Promise.resolve();
        }

        // console.log / serial output -> the editor's Console pane (via super) and the
        // simulator iframe.
        writeSerial(s: string) {
            super.writeSerial(s);
            const el = document.getElementById("console");
            if (el) {
                el.textContent += s;
                el.scrollTop = el.scrollHeight;
            }
        }
    }

    export function board(): BitsflowBoard {
        return runtime.board as BitsflowBoard;
    }

    export function initRuntimeWithBitsflowBoard() {
        U.assert(!runtime.board);
        runtime.board = new BitsflowBoard();
    }

    if (!pxsim.initCurrentRuntime) {
        pxsim.initCurrentRuntime = initRuntimeWithBitsflowBoard;
    }
}

// --- shims used by the base language ---

namespace pxsim.loops {
    export let pause = thread.pause;
    export let forever = thread.forever;
}

namespace pxsim.control {
    export function __log(priority: number, str: string) {
        runtime.board.writeSerial(str);
    }
}
