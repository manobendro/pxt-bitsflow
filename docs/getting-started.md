# Getting started

Bitsflow is a MakeCode editor that compiles your Blocks / JavaScript / Python program to
**PXT VM bytecode** and runs it on a **Raspberry Pi Pico (RP2040)**.

## Write a program

Drag blocks (or switch to JavaScript / Python). A first program that blinks the LED:

```blocks
basic.forever(function () {
    led.toggle()
    basic.pause(500)
})
```

## Wire the LED

The `led` blocks drive **GPIO 15** by default. Wire an LED like this:

```
GPIO15 ──[ ~330Ω ]──▶|── GND
                     LED
```

(To use a different pin, change `BITSFLOW_LED_PIN` in `libs/core/led.cpp` and rebuild
the firmware.)

## Download & flash

The **Download** button offers two options:

* **Firmware + program (.uf2)** — flash this once on a fresh board.
* **Program only (.uf2)** — flash this to update the program on a board that already has
  the firmware.

Hold **BOOTSEL** while plugging in the Pico (it appears as the `RPI-RP2` drive), then copy
the `.uf2` onto it. The board reboots and runs your program. `console.log` output is
available over USB serial and UART0 (GPIO0, 115200 baud).

## Next

See the [Reference](reference.md) for every device API: pins, NeoPixel, analog, PWM,
servo, music, timing, SPI, I2C and UART.
