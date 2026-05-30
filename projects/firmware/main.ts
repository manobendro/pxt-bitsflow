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
pins.setPull(DigitalPin.P2, PullMode.Up)

// neopixel / WS2812
const strip = neopixel.create(DigitalPin.P3, 8)
strip.setBrightness(64)
strip.setPixelColor(0, neopixel.rgb(255, 0, 0))
strip.setPixelBrightness(0, 128)
strip.showColor(neopixel.colors(NeoPixelColors.Green))
strip.clear()
strip.show()

// APA102 / DotStar (data + clock)
const dot = neopixel.createAPA102(DigitalPin.P4, DigitalPin.P5, 8)
dot.setPixelColor(0, NeoPixelColors.Blue)
dot.show()

// SPI
spi.init(DigitalPin.P18, DigitalPin.P19, DigitalPin.P16)
spi.setFrequency(1000000)
spi.setMode(0)
n = spi.write(0x55)
spi.transfer(control.createBuffer(2), control.createBuffer(2))

// I2C
i2c.init(DigitalPin.P4, DigitalPin.P5)
i2c.setFrequency(100000)
i2c.writeBuffer(0x3c, control.createBuffer(1))
i2c.readBuffer(0x3c, 2)
n = i2c.readNumber(0x3c, NumberFormat.UInt8LE)
i2c.writeNumber(0x3c, 1, NumberFormat.UInt8LE)

// UART
uart.init(DigitalPin.P8, DigitalPin.P9, 9600)
uart.setBaudRate(115200)
uart.writeString("hi")
uart.writeBuffer(control.createBuffer(2))
n = uart.available()
uart.readBuffer(1)

// PWM + servo
pwm.analogWritePin(DigitalPin.P0, 512)
pwm.analogSetPeriod(DigitalPin.P0, 1000)
pwm.servoWritePin(DigitalPin.P1, 90)
pwm.servoSetPulse(DigitalPin.P1, 1500)

// analog in (ADC)
n = analog.analogReadPin(DigitalPin.P26)
n = analog.analogReadRaw(DigitalPin.P27)
n = analog.analogReadMillivolts(DigitalPin.P28)

// tone / buzzer
music.setPin(DigitalPin.P0)
music.playTone(Note.C4, 200)
music.ringTone(Note.A4)
music.rest(100)

// pin timing / pulse
n = timing.pulseIn(DigitalPin.P2, PulseValue.High, 1000000)
n = timing.micros()
timing.delayMicros(100)

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
