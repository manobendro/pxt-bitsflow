# Sonar (HC-SR04)

Measure distance with an **HC-SR04** ultrasonic range finder. Built on [pins](/reference/pins)
and [timing](/reference/timing) — no buffers, no firmware change.

Wire **trig** to a GPIO output and **echo** to a GPIO input. The HC-SR04 is a 5 V part:
use a level shifter or a resistor divider on the **echo** line so it drives the RP2040's
3.3 V input safely.

## distanceCm

Measure the distance to an object in centimetres. Returns `0` on timeout (nothing in
range).

```sig
sonar.distanceCm(DigitalPin.P2, DigitalPin.P3, 400)
```

### Parameters

* **trig**: the trigger pin.
* **echo**: the echo pin.
* **maxCm**: maximum distance to wait for, in cm (default `400`).

### Returns

* the distance in cm, or `0` if nothing was detected within `maxCm`.

## distanceMm

Same measurement in millimetres.

```sig
sonar.distanceMm(DigitalPin.P2, DigitalPin.P3, 400)
```

## Example

Print the distance, and light the LED when something is closer than 10 cm.

```blocks
basic.forever(function () {
    let d = sonar.distanceCm(DigitalPin.P2, DigitalPin.P3, 400)
    console.log("" + d + " cm")
    if (d > 0 && d < 10) {
        led.on()
    } else {
        led.off()
    }
    basic.pause(100)
})
```

## See also

[pins](/reference/pins), [timing](/reference/timing)
