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

// neopixel/WS2812 + APA102/DotStar — no strip in the sim; report byte counts.
namespace pxsim.neopixel {
    export function sendBuffer(pin: number, buf: any) {
        const n = buf && buf.data ? buf.data.length : 0;
        board().writeSerial("neopixel: " + n + " bytes -> pin " + pin + "\n");
    }
    export function sendDotStar(dataPin: number, clkPin: number, buf: any) {
        const n = buf && buf.data ? buf.data.length : 0;
        board().writeSerial("dotstar: " + n + " bytes -> data " + dataPin + " clk " + clkPin + "\n");
    }
}

// SPI / I2C / UART — no hardware in the sim; log activity, reads return empty/0.
namespace pxsim.spi {
    export function init(sck: number, mosi: number, miso: number) { board().writeSerial("spi.init " + sck + "," + mosi + "," + miso + "\n"); }
    export function write(value: number): number { board().writeSerial("spi.write " + value + "\n"); return 0; }
    export function transfer(command: any, response: any) { board().writeSerial("spi.transfer\n"); }
    export function setFrequency(hz: number) { board().writeSerial("spi.setFrequency " + hz + "\n"); }
    export function setMode(mode: number) { board().writeSerial("spi.setMode " + mode + "\n"); }
}

namespace pxsim.i2c {
    export function init(sda: number, scl: number) { board().writeSerial("i2c.init " + sda + "," + scl + "\n"); }
    export function setFrequency(hz: number) { board().writeSerial("i2c.setFrequency " + hz + "\n"); }
    export function readBuffer(address: number, size: number, repeated: boolean): any { return pxsim.BufferMethods.createBuffer(size); }
    export function writeBuffer(address: number, buf: any, repeated: boolean) { board().writeSerial("i2c.writeBuffer addr=" + address + "\n"); }
}

namespace pxsim.uart {
    export function init(tx: number, rx: number, baud: number) { board().writeSerial("uart.init " + tx + "," + rx + "@" + baud + "\n"); }
    export function setBaudRate(baud: number) { board().writeSerial("uart.setBaudRate " + baud + "\n"); }
    export function writeBuffer(buf: any) { board().writeSerial("uart.writeBuffer\n"); }
    export function readBuffer(size: number): any { return pxsim.BufferMethods.createBuffer(size); }
    export function available(): number { return 0; }
}
