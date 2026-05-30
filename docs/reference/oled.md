# OLED

Drive a monochrome **SSD1306 OLED** display (128×64 or 128×32) over I2C. This is a
higher-level driver built on the [I2C](/reference/i2c) bus — pure software, so it works
with the existing firmware.

Wire the display's `SDA`/`SCL` to the I2C pins (default `SDA=P4`, `SCL=P5`); if you use
other pins, call `i2c.init(sda, scl)` before `oled.init`. Most modules use I2C address
**60** (`0x3C`).

Drawing functions write to an in-memory buffer; call `show()` to push it to the panel
(`showString` / `showNumber` push for you).

## init

Initialize the display. Call once before drawing.

```sig
oled.init(128, 64, 60)
```

### Parameters

* **width**: display width in pixels (usually `128`).
* **height**: display height in pixels (`64` or `32`).
* **address**: 7-bit I2C address, usually `60` (`0x3C`).

## showString

Show text on a text line (0-based, 8 px tall), clearing that line first, and update the
display.

```sig
oled.showString("hello", 0)
```

### Parameters

* **text**: the text to show (printable ASCII).
* **line**: the text row, `0` at the top.

### Example

```blocks
oled.init(128, 64, 60)
oled.showString("Hello, world!", 0)
oled.showString("Bitsflow RP2040", 1)
```

## showNumber

Show a number on a text line.

```sig
oled.showNumber(0, 0)
```

### Parameters

* **value**: the number to show.
* **line**: the text row.

## clear / show

`clear()` blanks the buffer; `show()` sends the buffer to the display.

```sig
oled.clear()
```

## setPixel

Set or clear a single pixel in the buffer (call `show()` to update).

```sig
oled.setPixel(0, 0, true)
```

### Parameters

* **x**: column, `0` at left.
* **y**: row, `0` at top.
* **on**: `true` to light, `false` to clear.

## fillRect

Draw a filled rectangle into the buffer (call `show()` to update).

```sig
oled.fillRect(0, 0, 8, 8, true)
```

## invert

Invert the whole display (applies immediately).

```sig
oled.invert(true)
```

## Example

Count up on the display once a second.

```blocks
oled.init(128, 64, 60)
let n = 0
basic.forever(function () {
    oled.showString("count:", 0)
    oled.showNumber(n, 1)
    n += 1
    basic.pause(1000)
})
```

## See also

[I2C](/reference/i2c)
