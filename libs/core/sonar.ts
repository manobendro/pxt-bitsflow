/**
 * Measure distance with an HC-SR04 ultrasonic range finder.
 *
 * Pure TypeScript on `pins` + `timing.pulseIn` — no buffers, no firmware change.
 * Wire: trig -> a GPIO output, echo -> a GPIO input (use a level shifter / divider on
 * echo if the sensor is 5V).
 */
//% color="#00838F" weight=94 icon="" block="Sonar"
namespace sonar {
    /**
     * Measure the distance to an object, in centimetres. Returns 0 on timeout
     * (nothing in range).
     * @param trig the trigger pin
     * @param echo the echo pin
     * @param maxCm maximum distance to wait for, in cm, eg: 400
     */
    //% blockId=sonar_ping_cm block="sonar distance (cm)|trig %trig|echo %echo"
    //% maxCm.defl=400 weight=100
    export function distanceCm(trig: DigitalPin, echo: DigitalPin, maxCm: number = 400): number {
        // 10us trigger pulse
        pins.digitalWritePin(trig, 0);
        timing.delayMicros(2);
        pins.digitalWritePin(trig, 1);
        timing.delayMicros(10);
        pins.digitalWritePin(trig, 0);

        // echo high time in us; sound travels ~58us per cm round-trip
        const maxUs = maxCm * 58 + 200;
        const us = timing.pulseIn(echo, PulseValue.High, maxUs);
        if (us <= 0) return 0;
        return Math.idiv(us, 58);
    }

    /**
     * Measure the distance to an object, in millimetres. Returns 0 on timeout.
     * @param trig the trigger pin
     * @param echo the echo pin
     * @param maxCm maximum distance to wait for, in cm, eg: 400
     */
    //% blockId=sonar_ping_mm block="sonar distance (mm)|trig %trig|echo %echo"
    //% maxCm.defl=400 weight=90
    export function distanceMm(trig: DigitalPin, echo: DigitalPin, maxCm: number = 400): number {
        pins.digitalWritePin(trig, 0);
        timing.delayMicros(2);
        pins.digitalWritePin(trig, 1);
        timing.delayMicros(10);
        pins.digitalWritePin(trig, 0);

        const maxUs = maxCm * 58 + 200;
        const us = timing.pulseIn(echo, PulseValue.High, maxUs);
        if (us <= 0) return 0;
        // 5.8us per mm round-trip -> mm = us*10/58
        return Math.idiv(us * 10, 58);
    }
}
