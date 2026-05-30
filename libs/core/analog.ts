/**
 * Read analog (ADC) values from a pin. RP2040 ADC pins are GP26–GP28.
 */
//% color="#F57C00" weight=95 icon="" block="Analog"
declare namespace analog {
    /**
     * Read the analog value on a pin, scaled to 0-1023.
     * @param pin the ADC pin to read (P26–P28)
     */
    //% blockId=analog_read_pin block="analog read pin %pin" weight=100
    //% shim=analog::analogReadPin
    function analogReadPin(pin: DigitalPin): number;

    /**
     * Read the raw 12-bit analog value (0-4095) on a pin.
     * @param pin the ADC pin to read (P26–P28)
     */
    //% blockId=analog_read_raw block="analog read raw %pin" weight=90
    //% shim=analog::analogReadRaw
    function analogReadRaw(pin: DigitalPin): number;

    /**
     * Read the analog value on a pin in millivolts (3.3V reference).
     * @param pin the ADC pin to read (P26–P28)
     */
    //% blockId=analog_read_mv block="analog read (mV) %pin" weight=80
    //% shim=analog::analogReadMillivolts
    function analogReadMillivolts(pin: DigitalPin): number;
}
