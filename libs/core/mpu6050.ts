/**
 * Read acceleration, rotation and temperature from an InvenSense MPU6050
 * (accelerometer + gyroscope) over I2C.
 *
 * Pure TypeScript on the `i2c` bus, so it needs no firmware change.
 */
//% color="#DB4437" weight=95 icon="" block="MPU6050"
namespace mpu6050 {
    const REG_PWR_MGMT_1 = 0x6b;
    const REG_ACCEL_XOUT = 0x3b; // 14 bytes: ax,ay,az,temp,gx,gy,gz (big-endian int16)
    const ACCEL_SCALE = 16384.0; // LSB/g at ±2g (default)
    const GYRO_SCALE = 131.0;    // LSB/(°/s) at ±250°/s (default)

    let _addr = 0x68;
    let _inited = false;

    /**
     * Initialize the MPU6050 (wakes it from sleep). Call once before reading.
     * @param address 7-bit I2C address, 0x68 or 0x69, eg: 104
     */
    //% blockId=mpu6050_init block="MPU6050 init address %address"
    //% address.defl=104 weight=100
    export function init(address: number = 0x68): void {
        _addr = address;
        // clear sleep bit -> wake up
        const b = control.createBuffer(2);
        b[0] = REG_PWR_MGMT_1;
        b[1] = 0x00;
        i2c.writeBuffer(_addr, b);
        _inited = true;
    }

    function ensure(): void {
        if (!_inited) init();
    }

    // read all 14 sensor bytes at once
    function readAll(): Buffer {
        ensure();
        return i2c.readRegister(_addr, REG_ACCEL_XOUT, 14);
    }

    function s16(buf: Buffer, off: number): number {
        return buf.getNumber(NumberFormat.Int16BE, off);
    }

    /**
     * Acceleration on the X axis in g (1 g ≈ 9.81 m/s²).
     */
    //% blockId=mpu6050_ax block="MPU6050 accel X (g)" weight=90
    export function accelX(): number { return s16(readAll(), 0) / ACCEL_SCALE; }

    /**
     * Acceleration on the Y axis in g.
     */
    //% blockId=mpu6050_ay block="MPU6050 accel Y (g)" weight=89
    export function accelY(): number { return s16(readAll(), 2) / ACCEL_SCALE; }

    /**
     * Acceleration on the Z axis in g.
     */
    //% blockId=mpu6050_az block="MPU6050 accel Z (g)" weight=88
    export function accelZ(): number { return s16(readAll(), 4) / ACCEL_SCALE; }

    /**
     * Rotation rate on the X axis in degrees/second.
     */
    //% blockId=mpu6050_gx block="MPU6050 gyro X (°/s)" weight=86
    export function gyroX(): number { return s16(readAll(), 8) / GYRO_SCALE; }

    /**
     * Rotation rate on the Y axis in degrees/second.
     */
    //% blockId=mpu6050_gy block="MPU6050 gyro Y (°/s)" weight=85
    export function gyroY(): number { return s16(readAll(), 10) / GYRO_SCALE; }

    /**
     * Rotation rate on the Z axis in degrees/second.
     */
    //% blockId=mpu6050_gz block="MPU6050 gyro Z (°/s)" weight=84
    export function gyroZ(): number { return s16(readAll(), 12) / GYRO_SCALE; }

    /**
     * Chip temperature in degrees Celsius.
     */
    //% blockId=mpu6050_temp block="MPU6050 temperature (°C)" weight=80
    export function temperature(): number {
        return s16(readAll(), 6) / 340.0 + 36.53;
    }
}
