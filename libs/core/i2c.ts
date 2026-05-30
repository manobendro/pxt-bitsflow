/**
 * I2C master communication (one bus).
 */
//% color="#00ACC1" weight=81 icon="" block="I2C"
namespace i2c {
    let _inited = false;

    function ensure(): void {
        if (!_inited) {
            // default pins: SDA=GP4, SCL=GP5 (Pico default I2C0)
            init(DigitalPin.P4, DigitalPin.P5);
        }
    }

    /**
     * Initialize the I2C bus on the given pins (100 kHz, pull-ups enabled).
     * The hardware I2C peripheral is chosen automatically from the pins.
     * @param sda the data pin
     * @param scl the clock pin
     */
    //% blockId=i2c_init block="I2C init sda %sda|scl %scl" weight=100
    export function init(sda: DigitalPin, scl: DigitalPin): void {
        __init(sda, scl);
        _inited = true;
    }

    /**
     * Set the I2C clock frequency in Hz.
     * @param hz frequency, eg: 100000
     */
    //% blockId=i2c_freq block="I2C set frequency %hz" weight=90
    export function setFrequency(hz: number): void {
        ensure();
        __setFrequency(hz);
    }

    /**
     * Read `size` bytes from a 7-bit I2C device address.
     * @param address 7-bit device address
     * @param size number of bytes to read
     * @param repeated leave the bus held (repeated start) for a following operation
     */
    //% blockId=i2c_read_buffer block="I2C read %size|bytes from %address" weight=80
    export function readBuffer(address: number, size: number, repeated: boolean = false): Buffer {
        ensure();
        return __readBuffer(address, size, repeated);
    }

    /**
     * Write a buffer to a 7-bit I2C device address.
     * @param address 7-bit device address
     * @param buf bytes to write
     * @param repeated leave the bus held (repeated start) for a following operation
     */
    //% blockId=i2c_write_buffer block="I2C write %buf|to %address" weight=79
    export function writeBuffer(address: number, buf: Buffer, repeated: boolean = false): void {
        ensure();
        __writeBuffer(address, buf, repeated);
    }

    /**
     * Read a number of the given format from an I2C device.
     */
    //% blockId=i2c_read_number block="I2C read number from %address|format %format" weight=70
    export function readNumber(address: number, format: NumberFormat = NumberFormat.UInt8LE): number {
        const n = pins.sizeOf(format);
        const buf = readBuffer(address, n);
        return buf.getNumber(format, 0);
    }

    /**
     * Write a number of the given format to an I2C device.
     */
    //% blockId=i2c_write_number block="I2C write number %value|to %address|format %format" weight=69
    export function writeNumber(address: number, value: number, format: NumberFormat = NumberFormat.UInt8LE, repeated: boolean = false): void {
        const buf = control.createBuffer(pins.sizeOf(format));
        buf.setNumber(format, 0, value);
        writeBuffer(address, buf, repeated);
    }

    /**
     * Read from a register (write the register index, then read `size` bytes).
     */
    //% blockId=i2c_read_register block="I2C read %size|bytes from %address|register %reg" weight=60
    export function readRegister(address: number, reg: number, size: number): Buffer {
        const r = control.createBuffer(1);
        r.setNumber(NumberFormat.UInt8LE, 0, reg);
        writeBuffer(address, r, true);
        return readBuffer(address, size);
    }
}

declare namespace i2c {
    //% shim=i2c::init
    function __init(sda: DigitalPin, scl: DigitalPin): void;
    //% shim=i2c::setFrequency
    function __setFrequency(hz: int32): void;
    //% shim=i2c::readBuffer
    function __readBuffer(address: int32, size: int32, repeated: boolean): Buffer;
    //% shim=i2c::writeBuffer
    function __writeBuffer(address: int32, buf: Buffer, repeated: boolean): void;
}
