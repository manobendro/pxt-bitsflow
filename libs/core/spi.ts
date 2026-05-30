/**
 * SPI master communication (one bus).
 */
//% color="#11B5AC" weight=82 icon="" block="SPI"
namespace spi {
    let _inited = false;

    function ensure(): void {
        if (!_inited) {
            // default pins: SCK=GP18, MOSI=GP19, MISO=GP16 (Pico default SPI0)
            init(DigitalPin.P18, DigitalPin.P19, DigitalPin.P16);
        }
    }

    /**
     * Initialize the SPI bus on the given pins (1 MHz, mode 0).
     * The hardware SPI peripheral is chosen automatically from the pins.
     * @param sck the clock pin
     * @param mosi the master-out / data-out pin
     * @param miso the master-in / data-in pin
     */
    //% blockId=spi_init block="SPI init sck %sck|mosi %mosi|miso %miso" weight=100
    export function init(sck: DigitalPin, mosi: DigitalPin, miso: DigitalPin): void {
        __init(sck, mosi, miso);
        _inited = true;
    }

    /**
     * Write a byte to the SPI bus and return the byte read back.
     * @param value the byte to send (0-255)
     */
    //% blockId=spi_write block="SPI write %value" weight=90
    export function write(value: number): number {
        ensure();
        return __write(value & 0xff);
    }

    /**
     * Transfer a buffer over the SPI bus. `command` is sent; received bytes are written
     * into `response` (either may be null).
     */
    //% blockId=spi_transfer block="SPI transfer %command|into %response" weight=85
    export function transfer(command: Buffer, response: Buffer): void {
        ensure();
        __transfer(command, response);
    }

    /**
     * Set the SPI clock frequency in Hz.
     * @param hz frequency, eg: 1000000
     */
    //% blockId=spi_freq block="SPI set frequency %hz" weight=80
    export function setFrequency(hz: number): void {
        ensure();
        __setFrequency(hz);
    }

    /**
     * Set the SPI mode (0-3): clock polarity/phase.
     * @param mode 0,1,2 or 3
     */
    //% blockId=spi_mode block="SPI set mode %mode" mode.min=0 mode.max=3 weight=75
    export function setMode(mode: number): void {
        ensure();
        __setMode(mode & 3);
    }
}

declare namespace spi {
    //% shim=spi::init
    function __init(sck: DigitalPin, mosi: DigitalPin, miso: DigitalPin): void;
    //% shim=spi::write
    function __write(value: int32): int32;
    //% shim=spi::transfer
    function __transfer(command: Buffer, response: Buffer): void;
    //% shim=spi::setFrequency
    function __setFrequency(hz: int32): void;
    //% shim=spi::setMode
    function __setMode(mode: int32): void;
}
