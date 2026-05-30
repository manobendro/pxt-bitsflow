/**
 * PWM output and servo control.
 */
//% color="#FF9900" weight=86 icon="" block="PWM"
namespace pwm {
    /**
     * Write an analog (PWM) value to a pin.
     * @param pin the pin to write to
     * @param value the duty cycle, 0 to 1023
     */
    //% blockId=pwm_analog_write block="analog write pin %pin|to %value" weight=100
    //% value.min=0 value.max=1023
    export function analogWritePin(pin: DigitalPin, value: number): void {
        __analogWritePin(pin, value | 0);
    }

    /**
     * Set the PWM period of a pin in microseconds.
     * @param pin the pin to configure
     * @param micros the period in microseconds, eg: 1000
     */
    //% blockId=pwm_analog_set_period block="analog set period pin %pin|to %micros (us)" weight=90
    export function analogSetPeriod(pin: DigitalPin, micros: number): void {
        __analogSetPeriod(pin, micros | 0);
    }

    /**
     * Write a servo angle to a pin (standard 50Hz servo).
     * @param pin the pin the servo is connected to
     * @param angle the angle, 0 to 180
     */
    //% blockId=pwm_servo_write block="servo write pin %pin|to %angle" weight=80
    //% angle.min=0 angle.max=180
    export function servoWritePin(pin: DigitalPin, angle: number): void {
        __servoWritePin(pin, angle | 0);
    }

    /**
     * Set the servo pulse width on a pin directly, in microseconds (at 20ms period).
     * @param pin the pin the servo is connected to
     * @param micros the pulse width in microseconds, eg: 1500
     */
    //% blockId=pwm_servo_set_pulse block="servo set pulse pin %pin|to %micros (us)" weight=70
    export function servoSetPulse(pin: DigitalPin, micros: number): void {
        __servoSetPulse(pin, micros | 0);
    }
}

declare namespace pwm {
    //% shim=pwm::analogWritePin
    function __analogWritePin(pin: DigitalPin, value: int32): void;
    //% shim=pwm::analogSetPeriod
    function __analogSetPeriod(pin: DigitalPin, micros: int32): void;
    //% shim=pwm::servoWritePin
    function __servoWritePin(pin: DigitalPin, angle: int32): void;
    //% shim=pwm::servoSetPulse
    function __servoSetPulse(pin: DigitalPin, micros: int32): void;
}
