# Timing

Microsecond timing and pulse measurement on a pin for the Raspberry Pi Pico (RP2040).

These functions use polling (busy-waiting) to read pulses and to wait for very short delays, so they give fine-grained timing for sensors and protocols that work in microseconds. The `PulseValue` enum selects which pin level to measure: `PulseValue.High` (`1`) or `PulseValue.Low` (`0`).

## pulseIn

Measure how long, in microseconds, a pin stays at a given level.

```sig
timing.pulseIn(DigitalPin.P2, PulseValue.High, 1000000)
```

### Parameters

* **pin**: the [DigitalPin](/reference) (`P0`..`P28`) to read the pulse from.
* **value**: the [PulseValue](/reference) level to measure, either `PulseValue.High` or `PulseValue.Low`.
* **maxDurationUs**: a [number](/types/number) giving the longest time to wait in microseconds before giving up. In Blocks this defaults to `1000000`.

### Returns

* a [number](/types/number) giving the pulse length in microseconds, or `0` if the pin did not reach the level within **maxDurationUs**.

```blocks
let duration = timing.pulseIn(DigitalPin.P2, PulseValue.High, 1000000)
```

## micros

Get the number of microseconds since the board was powered on.

```sig
timing.micros()
```

### Returns

* a [number](/types/number) giving the microseconds since power-on. The value wraps back to `0` roughly every 35 minutes.

```blocks
let now = timing.micros()
```

## delayMicros

Busy-wait for a number of microseconds.

```sig
timing.delayMicros(100)
```

### Parameters

* **us**: a [number](/types/number) giving how many microseconds to wait.

```blocks
timing.delayMicros(100)
```

## Example

Read an HC-SR04-style ultrasonic sensor by measuring the high pulse on the echo pin **P2**:

```blocks
let echo = timing.pulseIn(DigitalPin.P2, PulseValue.High, 1000000)
```

Measure how long a piece of code takes to run with [micros](/reference/timing/micros):

```blocks
let start = timing.micros()
timing.delayMicros(500)
let elapsed = timing.micros() - start
```
