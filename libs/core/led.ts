/**
 * Turn a single LED (wired to a GPIO pin) on and off.
 */
//% color="#5C2D91" weight=100 icon="" block="LED"
declare namespace led {
    /**
     * Turn the LED on.
     */
    //% blockId=led_on block="turn LED on" weight=90
    //% shim=led::on
    function on(): void;

    /**
     * Turn the LED off.
     */
    //% blockId=led_off block="turn LED off" weight=80
    //% shim=led::off
    function off(): void;

    /**
     * Toggle the LED: on if it was off, off if it was on.
     */
    //% blockId=led_toggle block="toggle LED" weight=70
    //% shim=led::toggle
    function toggle(): void;
}
