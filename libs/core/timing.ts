/**
 * Level used when measuring a pulse.
 */
const enum PulseValue {
    //% block=high
    High = 1,
    //% block=low
    Low = 0
}

/**
 * Microsecond timing and pulse measurement on a pin (polling based).
 */
//% color="#708090" weight=84 icon="" block="Timing"
declare namespace timing {
    /**
     * Measure the length (in microseconds) of a pulse at the given level on a pin.
     * Waits for the level to start, then times until it ends, bounded by maxDurationUs.
     * Returns 0 on timeout.
     * @param pin the pin to measure
     * @param value the pulse level to time (high or low)
     * @param maxDurationUs timeout in microseconds, eg: 1000000
     */
    //% blockId=timing_pulse_in block="pulse in %pin|%value" weight=100
    //% shim=timing::pulseIn
    function pulseIn(pin: DigitalPin, value: PulseValue, maxDurationUs: int32): number;

    /**
     * Microseconds since power-on (wraps about every 35 minutes).
     */
    //% blockId=timing_micros block="micros (µs)" weight=90
    //% shim=timing::micros
    function micros(): number;

    /**
     * Busy-wait for the given number of microseconds.
     * @param us microseconds to wait
     */
    //% blockId=timing_delay_us block="delay (µs) %us" weight=80
    //% shim=timing::delayMicros
    function delayMicros(us: int32): void;
}
