# NeoPixel / DotStar

The **neopixel** namespace drives addressable RGB LED strips on the Raspberry Pi Pico (RP2040).
It supports **WS2812 / NeoPixel** strips, which use a single data pin (driven by a PIO state
machine at 800kHz), and **APA102 / DotStar** strips, which use a data pin plus a clock pin
(bit-banged in software). In the simulator the strip operations log the number of bytes sent
to the console.

Colors are packed into a single number (`0xRRGGBB`). You can build one with
[neopixel.rgb](#neopixel-rgb) or pick a named color with [neopixel.colors](#neopixel-colors).

## neopixel.create

Create a WS2812 / NeoPixel strip on a single data pin. The default brightness is `64`.

```sig
neopixel.create(DigitalPin.P0, 8)
```

### Parameters

* **pin**: the [DigitalPin](/reference/neopixel) (`P0`..`P28`) connected to the strip's data line.
* **numleds**: the [number](/types/number) of LEDs on the strip.

### Returns

* a [Strip](#strip) object you can use to set pixel colors and update the strip.

```blocks
let strip = neopixel.create(DigitalPin.P3, 8)
```

## neopixel.createAPA102

Create an APA102 / DotStar strip on a data pin and a clock pin.

```sig
neopixel.createAPA102(DigitalPin.P0, DigitalPin.P1, 8)
```

### Parameters

* **dataPin**: the [DigitalPin](/reference/neopixel) connected to the strip's data line.
* **clkPin**: the [DigitalPin](/reference/neopixel) connected to the strip's clock line.
* **numleds**: the [number](/types/number) of LEDs on the strip.

### Returns

* a [Strip](#strip) object you can use to set pixel colors and update the strip.

```blocks
let strip = neopixel.createAPA102(DigitalPin.P3, DigitalPin.P4, 8)
```

## neopixel.rgb

Pack red, green, and blue values into a single color number.

```sig
neopixel.rgb(255, 0, 0)
```

### Parameters

* **red**: the [number](/types/number) of red, from `0` to `255`.
* **green**: the [number](/types/number) of green, from `0` to `255`.
* **blue**: the [number](/types/number) of blue, from `0` to `255`.

### Returns

* a [number](/types/number) holding the packed RGB color.

```blocks
let strip = neopixel.create(DigitalPin.P3, 8)
strip.showColor(neopixel.rgb(255, 128, 0))
```

## neopixel.colors

Get the color value for a named color.

```sig
neopixel.colors(NeoPixelColors.Red)
```

### Parameters

* **color**: a [NeoPixelColors](/reference/neopixel) value: `Red`, `Orange`, `Yellow`, `Green`,
  `Blue`, `Indigo`, `Violet`, `Purple`, `White`, or `Black`.

### Returns

* a [number](/types/number) holding the color value.

```blocks
let strip = neopixel.create(DigitalPin.P3, 8)
strip.showColor(neopixel.colors(NeoPixelColors.Green))
```

## setPixelColor

Set the color of one pixel on the strip. Call [show](#show) to send the change to the strip.

```sig
strip.setPixelColor(0, 0)
```

### Parameters

* **index**: the [number](/types/number) of the pixel to set, starting at `0`.
* **rgb**: the [number](/types/number) color to set the pixel to.

```blocks
let strip = neopixel.create(DigitalPin.P3, 8)
strip.setPixelColor(0, neopixel.colors(NeoPixelColors.Red))
strip.show()
```

## setPixelBrightness

Set the brightness of one pixel, from `0` to `255`. This overrides the global brightness for
that pixel.

```sig
strip.setPixelBrightness(0, 255)
```

### Parameters

* **index**: the [number](/types/number) of the pixel to set, starting at `0`.
* **brightness**: the [number](/types/number) brightness, from `0` (off) to `255` (full).

```blocks
let strip = neopixel.create(DigitalPin.P3, 8)
strip.setPixelBrightness(0, 128)
strip.setPixelColor(0, neopixel.colors(NeoPixelColors.Blue))
strip.show()
```

## showColor

Set every pixel on the strip to one color and update the strip immediately.

```sig
strip.showColor(0)
```

### Parameters

* **rgb**: the [number](/types/number) color to set all pixels to.

```blocks
let strip = neopixel.create(DigitalPin.P3, 8)
strip.showColor(neopixel.colors(NeoPixelColors.Green))
```

## show

Send the current pixel colors to the strip. Use this after changing pixels with
[setPixelColor](#setpixelcolor) to make the changes appear.

```sig
strip.show()
```

```blocks
let strip = neopixel.create(DigitalPin.P3, 8)
strip.setPixelColor(0, neopixel.colors(NeoPixelColors.Violet))
strip.show()
```

## clear

Turn off all pixels on the strip. Call [show](#show) to send the change to the strip.

```sig
strip.clear()
```

```blocks
let strip = neopixel.create(DigitalPin.P3, 8)
strip.clear()
strip.show()
```

## setBrightness

Set the global brightness for the whole strip, from `0` to `255`.

```sig
strip.setBrightness(64)
```

### Parameters

* **brightness**: the [number](/types/number) brightness, from `0` (off) to `255` (full).

```blocks
let strip = neopixel.create(DigitalPin.P3, 8)
strip.setBrightness(32)
strip.showColor(neopixel.colors(NeoPixelColors.White))
```

## length

Get the number of pixels on the strip.

```sig
strip.length()
```

### Returns

* the [number](/types/number) of pixels on the strip.

```blocks
let strip = neopixel.create(DigitalPin.P3, 8)
let count = strip.length()
```

## Example

Create an 8-LED WS2812 strip on pin **P3** and show it all green, then run a forever loop
that walks a single white pixel along the strip.

```blocks
let strip = neopixel.create(DigitalPin.P3, 8)
strip.setBrightness(64)
strip.showColor(neopixel.colors(NeoPixelColors.Green))

let pos = 0
basic.forever(function () {
    strip.clear()
    strip.setPixelColor(pos, neopixel.colors(NeoPixelColors.White))
    strip.show()
    pos = (pos + 1) % strip.length()
    basic.pause(100)
})
```
