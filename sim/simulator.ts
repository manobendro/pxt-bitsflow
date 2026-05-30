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

// led.on/off/toggle — no LED in the sim, so just report state to the console.
namespace pxsim.led {
    let state = false;
    function show() { board().writeSerial("LED " + (state ? "on" : "off") + "\n"); }
    export function on() { state = true; show(); }
    export function off() { state = false; show(); }
    export function toggle() { state = !state; show(); }
}

// pins digital GPIO — no hardware in the sim, so report writes and return 0 for reads.
namespace pxsim.pins {
    const state: { [pin: number]: number } = {};
    export function digitalWritePin(name: number, value: number) {
        state[name] = value ? 1 : 0;
        board().writeSerial("P" + name + " <- " + state[name] + "\n");
    }
    export function digitalReadPin(name: number): number {
        return state[name] | 0;
    }
    export function setPull(name: number, pull: number) { /* no-op in sim */ }
}
