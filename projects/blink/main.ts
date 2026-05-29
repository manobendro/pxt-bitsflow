// Blink: toggle the LED twice a second, forever — and log each toggle over serial.
let n = 0
basic.forever(function () {
    led.toggle()
    n += 1
    console.log("blink " + n)
    basic.pause(500)
})
