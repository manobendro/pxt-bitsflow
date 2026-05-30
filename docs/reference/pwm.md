# PWM

Write PWM (pulse-width modulation) signals and control servos on your
Raspberry Pi Pico (RP2040).

PWM output and servo control use the RP2040 hardware PWM. The PWM slice is
chosen automatically based on the pin you use. In the simulator, PWM writes are
logged to the console.

## analogWritePin

Write a PWM signal to a pin with a duty cycle in the range ``0`` to ``1023``.

```sig
pwm.analogWritePin(DigitalPin.P0, 512)
```

### Parameters

* **pin**: the pin to write the PWM signal to.
* **value**: a [number](/types/number) between ``0`` and ``1023`` for the duty
cycle, where ``0`` is always off and ``1023`` is always on.

```blocks
pwm.analogWritePin(DigitalPin.P0, 512)
```

## analogSetPeriod

Set the period of the PWM signal on a pin, in microseconds.

```sig
pwm.analogSetPeriod(DigitalPin.P0, 20000)
```

### Parameters

* **pin**: the pin to set the PWM period for.
* **micros**: a [number](/types/number) for the PWM period in microseconds.

```blocks
pwm.analogSetPeriod(DigitalPin.P0, 20000)
```

## servoWritePin

Set the angle of a servo connected to a pin, from ``0`` to ``180`` degrees.

This uses a ``500``-``2500`` microsecond pulse at ``50Hz``.

```sig
pwm.servoWritePin(DigitalPin.P1, 90)
```

### Parameters

* **pin**: the pin the servo is connected to.
* **angle**: a [number](/types/number) between ``0`` and ``180`` for the servo
angle in degrees.

```blocks
pwm.servoWritePin(DigitalPin.P1, 90)
```

## servoSetPulse

Set the servo pulse width on a pin directly, in microseconds.

```sig
pwm.servoSetPulse(DigitalPin.P1, 1500)
```

### Parameters

* **pin**: the pin the servo is connected to.
* **micros**: a [number](/types/number) for the pulse width in microseconds
(typically ``500`` to ``2500``).

```blocks
pwm.servoSetPulse(DigitalPin.P1, 1500)
```

## Example: fade an LED

Fade an LED on ``P0`` up and down by changing the PWM duty cycle in a loop.

```blocks
basic.forever(function () {
    for (let value = 0; value <= 1023; value += 16) {
        pwm.analogWritePin(DigitalPin.P0, value)
        basic.pause(10)
    }
    for (let value = 1023; value >= 0; value -= 16) {
        pwm.analogWritePin(DigitalPin.P0, value)
        basic.pause(10)
    }
})
```

## Example: sweep a servo

Sweep a servo on ``P1`` back and forth between ``0`` and ``180`` degrees.

```blocks
basic.forever(function () {
    for (let angle = 0; angle <= 180; angle += 10) {
        pwm.servoWritePin(DigitalPin.P1, angle)
        basic.pause(100)
    }
    for (let angle = 180; angle >= 0; angle -= 10) {
        pwm.servoWritePin(DigitalPin.P1, angle)
        basic.pause(100)
    }
})
```
