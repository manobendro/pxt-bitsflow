/**
 * Read and write digital values on the GPIO pins.
 */
//% color="#A80000" weight=99 icon="" block="Pins"
declare namespace pins {
    /**
     * Read the digital value (0 or 1) of a pin.
     * @param name the pin to read from
     */
    //% blockId=device_digital_read block="digital read pin %name"
    //% weight=30
    //% shim=pins::digitalReadPin
    function digitalReadPin(name: DigitalPin): number;

    /**
     * Set a pin to a digital value (0 or 1).
     * @param name the pin to write to
     * @param value the value to set, 0 or 1
     */
    //% blockId=device_digital_write block="digital write pin %name to %value"
    //% weight=29 value.min=0 value.max=1
    //% shim=pins::digitalWritePin
    function digitalWritePin(name: DigitalPin, value: number): void;

    /**
     * Configure the pull resistor of a pin.
     * @param name the pin to configure
     * @param pull the pull direction
     */
    //% blockId=device_set_pull block="set pull pin %name to %pull"
    //% weight=18
    //% shim=pins::setPull
    function setPull(name: DigitalPin, pull: PinPullMode): void;
}

// RP2040 GPIOs. (On a Raspberry Pi Pico, GP23/24/25 are used internally; the others map
// to the labelled header pins.)
declare const enum DigitalPin {
    P0 = 0, P1 = 1, P2 = 2, P3 = 3, P4 = 4, P5 = 5, P6 = 6, P7 = 7,
    P8 = 8, P9 = 9, P10 = 10, P11 = 11, P12 = 12, P13 = 13, P14 = 14,
    P15 = 15, P16 = 16, P17 = 17, P18 = 18, P19 = 19, P20 = 20, P21 = 21,
    P22 = 22, P23 = 23, P24 = 24, P25 = 25, P26 = 26, P27 = 27, P28 = 28
}

// PinPullMode (PullDown=0, PullUp=1, PullNone=2) is already declared in core's enums.d.ts.
