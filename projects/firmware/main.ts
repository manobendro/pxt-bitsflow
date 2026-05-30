// Shim manifest for the prebuilt firmware.
//
// This program is NEVER run on the device — the firmware loads the real program from a
// fixed flash region at boot. Its only job is to *reference* every API so the compiler
// emits a pointers.cpp containing a SUPERSET of shims. That lets a single prebuilt
// firmware run any program the editor can produce.
//
// When you add a new block/API/library to the target, add a reference to it here and
// rebuild the firmware once.

// language runtime: arithmetic, strings, arrays (numops / string / array shims)
let n = 1 + 2 * 3
let s = "v" + n
let arr = [1, 2, 3]
arr.push(n)
n = arr.length

// LED
led.on()
led.off()
led.toggle()

// digital GPIO
pins.digitalWritePin(DigitalPin.P0, 1)
n = pins.digitalReadPin(DigitalPin.P1)
pins.setPull(DigitalPin.P2, PinPullMode.PullUp)

// console / serial
console.log(s)

// control / timing
control.millis()

// loops / basic
basic.pause(1)
basic.forever(function () {
    led.toggle()
    console.log("tick " + n)
})
