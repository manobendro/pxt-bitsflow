# LED

Control a single LED connected to the Raspberry Pi Pico (RP2040). Use these functions to turn the LED on or off, or to toggle its state.

**Hardware:** the LED is driven on **GPIO 15** on the RP2040 (configurable via `BITSFLOW_LED_PIN` in `libs/core/led.cpp`). Wire it as: GPIO15 -> ~330ohm resistor -> LED(+), LED(-) -> GND. In the simulator the LED state is logged to the console.

## on

Turn the LED on.

```sig
led.on()
```

### Parameters

* none

```blocks
led.on()
```

## off

Turn the LED off.

```sig
led.off()
```

### Parameters

* none

```blocks
led.off()
```

## toggle

Toggle the LED: if it is on, turn it off; if it is off, turn it on.

```sig
led.toggle()
```

### Parameters

* none

```blocks
led.toggle()
```

## Example

Blink the LED forever by toggling it twice a second.

```blocks
basic.forever(function () {
    led.toggle()
    basic.pause(500)
})
```
