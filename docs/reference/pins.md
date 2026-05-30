# Pins

Read and write digital values on the Raspberry Pi Pico (RP2040) GPIO pins **P0..P28**. The `DigitalPin` enum members `P0`..`P28` map directly to the chip pins `GP0`..`GP28`. The `PullMode` enum selects the internal resistor: `Down` = 0, `Up` = 1, `None` = 2.

## digitalReadPin

Read the digital value (`0` or `1`) of a GPIO pin.

```sig
pins.digitalReadPin(DigitalPin.P0)
```

### Parameters

* `name`: the [DigitalPin](/reference/pins) to read, `P0` through `P28`.

### Returns

* a [number](/types/number) that is `0` (low) or `1` (high).

```blocks
let value = pins.digitalReadPin(DigitalPin.P2)
```

## digitalWritePin

Write a digital value (`0` or `1`) to a GPIO pin.

```sig
pins.digitalWritePin(DigitalPin.P0, 0)
```

### Parameters

* `name`: the [DigitalPin](/reference/pins) to write, `P0` through `P28`.
* `value`: the [number](/types/number) to write, `0` (low) or `1` (high).

```blocks
pins.digitalWritePin(DigitalPin.P15, 1)
```

## setPull

Set the internal pull-up, pull-down, or no pull resistor on a GPIO pin.

```sig
pins.setPull(DigitalPin.P0, PullMode.Up)
```

### Parameters

* `name`: the [DigitalPin](/reference/pins) to configure, `P0` through `P28`.
* `pull`: the `PullMode` to use, `Down` (0), `Up` (1), or `None` (2).

```blocks
pins.setPull(DigitalPin.P2, PullMode.Up)
```

## onPinEvent

Run code when a pin's level changes. A background task polls the pin (about every 2 ms)
and raises an event on a **rising** edge (`0→1`), a **falling** edge (`1→0`), or any
**change**. Enable a pull resistor with `setPull` first if the pin would otherwise float.

```sig
pins.onPinEvent(DigitalPin.P2, PinEvent.Falling, function () {})
```

### Parameters

* `pin`: the [DigitalPin](/reference/pins) to watch, `P0` through `P28`.
* `event`: `PinEvent.Rising`, `PinEvent.Falling`, or `PinEvent.Changed`.
* `handler`: code to run when the event happens.

### Example

Toggle the LED each time a button on `P2` (wired to ground, internal pull-up enabled)
is pressed.

```blocks
pins.setPull(DigitalPin.P2, PullMode.Up)
pins.onPinEvent(DigitalPin.P2, PinEvent.Falling, function () {
    led.toggle()
})
```

## Example

Read a button on `P2` (with an internal pull-up) and mirror its state to the LED pin `P15`.

```blocks
pins.setPull(DigitalPin.P2, PullMode.Up)
basic.forever(function () {
    let pressed = pins.digitalReadPin(DigitalPin.P2)
    pins.digitalWritePin(DigitalPin.P15, pressed)
})
```
