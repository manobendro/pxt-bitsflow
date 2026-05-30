/**
 * UART / serial communication on a second hardware UART (separate from console.log,
 * which uses USB + the stdio UART).
 */
//% color="#B22222" weight=86 icon="" block="UART"
namespace uart {
    let _inited = false;

    function ensure(): void {
        if (!_inited) {
            // default pins: TX=GP8, RX=GP9 (UART1) so it doesn't clash with the
            // console's UART0 on GP0/1
            init(DigitalPin.P8, DigitalPin.P9, 9600);
        }
    }

    /**
     * Initialize the UART on the given pins and baud rate.
     * The hardware UART peripheral is chosen automatically from the TX pin.
     * @param tx the transmit pin
     * @param rx the receive pin
     * @param baud baud rate, eg: 9600
     */
    //% blockId=uart_init block="UART init tx %tx|rx %rx|baud %baud" weight=100
    export function init(tx: DigitalPin, rx: DigitalPin, baud: number = 9600): void {
        __init(tx, rx, baud);
        _inited = true;
    }

    /**
     * Set the baud rate.
     * @param baud baud rate, eg: 9600
     */
    //% blockId=uart_baud block="UART set baud rate %baud" weight=90
    export function setBaudRate(baud: number): void {
        ensure();
        __setBaudRate(baud);
    }

    /**
     * Write a string to the UART.
     */
    //% blockId=uart_write_string block="UART write string %text" weight=85
    export function writeString(text: string): void {
        ensure();
        __writeBuffer(control.createBufferFromUTF8(text));
    }

    /**
     * Write a buffer to the UART.
     */
    //% blockId=uart_write_buffer block="UART write buffer %buf" weight=84
    export function writeBuffer(buf: Buffer): void {
        ensure();
        __writeBuffer(buf);
    }

    /**
     * Read exactly `size` bytes from the UART (blocking).
     * @param size number of bytes to read
     */
    //% blockId=uart_read_buffer block="UART read %size|bytes" weight=80
    export function readBuffer(size: number): Buffer {
        ensure();
        return __readBuffer(size);
    }

    /**
     * Number of bytes available to read without blocking (0 or more).
     */
    //% blockId=uart_available block="UART available" weight=75
    export function available(): number {
        ensure();
        return __available();
    }
}

declare namespace uart {
    //% shim=uart::init
    function __init(tx: DigitalPin, rx: DigitalPin, baud: int32): void;
    //% shim=uart::setBaudRate
    function __setBaudRate(baud: int32): void;
    //% shim=uart::writeBuffer
    function __writeBuffer(buf: Buffer): void;
    //% shim=uart::readBuffer
    function __readBuffer(size: int32): Buffer;
    //% shim=uart::available
    function __available(): int32;
}
