/**
 * Read temperature and pressure from a Bosch BMP280 sensor over I2C.
 *
 * Pure TypeScript on the `i2c` bus, so it needs no firmware change. Uses the BMP280
 * datasheet's floating-point compensation (PXT numbers are doubles), which avoids the
 * 32-bit overflow pitfalls of the integer fixed-point version in a JS/VM runtime.
 */
//% color="#0F9D58" weight=96 icon="" block="BMP280"
namespace bmp280 {
    const REG_ID = 0xd0;        // chip id (0x58 for BMP280)
    const REG_CALIB = 0x88;     // 24 bytes of calibration (dig_T1..dig_P9)
    const REG_CTRL_MEAS = 0xf4;
    const REG_CONFIG = 0xf5;
    const REG_PRESS = 0xf7;     // press_msb..temp_xlsb, 6 bytes

    let _addr = 0x76;
    let _inited = false;

    // calibration coefficients (read from the chip in init)
    let T1 = 0, T2 = 0, T3 = 0;
    let P1 = 0, P2 = 0, P3 = 0, P4 = 0, P5 = 0, P6 = 0, P7 = 0, P8 = 0, P9 = 0;

    /**
     * Initialize the BMP280. Call once before reading. If you use non-default I2C pins,
     * call `i2c.init(sda, scl)` first.
     * @param address 7-bit I2C address, 0x76 or 0x77, eg: 118
     */
    //% blockId=bmp280_init block="BMP280 init address %address"
    //% address.defl=118 weight=100
    export function init(address: number = 0x76): void {
        _addr = address;

        // read 24 calibration bytes starting at 0x88
        const c = i2c.readRegister(_addr, REG_CALIB, 24);
        T1 = c.getNumber(NumberFormat.UInt16LE, 0);
        T2 = c.getNumber(NumberFormat.Int16LE, 2);
        T3 = c.getNumber(NumberFormat.Int16LE, 4);
        P1 = c.getNumber(NumberFormat.UInt16LE, 6);
        P2 = c.getNumber(NumberFormat.Int16LE, 8);
        P3 = c.getNumber(NumberFormat.Int16LE, 10);
        P4 = c.getNumber(NumberFormat.Int16LE, 12);
        P5 = c.getNumber(NumberFormat.Int16LE, 14);
        P6 = c.getNumber(NumberFormat.Int16LE, 16);
        P7 = c.getNumber(NumberFormat.Int16LE, 18);
        P8 = c.getNumber(NumberFormat.Int16LE, 20);
        P9 = c.getNumber(NumberFormat.Int16LE, 22);

        // config: standby 0.5ms, IIR filter off
        i2c.writeNumber(_addr, (REG_CONFIG << 8) | 0x00, NumberFormat.UInt16BE);
        // ctrl_meas: osrs_t x1, osrs_p x1, normal mode -> 0x27
        i2c.writeNumber(_addr, (REG_CTRL_MEAS << 8) | 0x27, NumberFormat.UInt16BE);
        _inited = true;
    }

    function ensure(): void {
        if (!_inited) init();
    }

    // returns [rawTemp(20-bit), rawPress(20-bit), t_fine]
    function readFine(): number {
        const d = i2c.readRegister(_addr, REG_PRESS, 6);
        const rawPress = (d.getNumber(NumberFormat.UInt8LE, 0) << 12)
            | (d.getNumber(NumberFormat.UInt8LE, 1) << 4)
            | (d.getNumber(NumberFormat.UInt8LE, 2) >> 4);
        const rawTemp = (d.getNumber(NumberFormat.UInt8LE, 3) << 12)
            | (d.getNumber(NumberFormat.UInt8LE, 4) << 4)
            | (d.getNumber(NumberFormat.UInt8LE, 5) >> 4);
        _lastRawPress = rawPress;
        const v1 = (rawTemp / 16384.0 - T1 / 1024.0) * T2;
        const v2 = (rawTemp / 131072.0 - T1 / 8192.0) * (rawTemp / 131072.0 - T1 / 8192.0) * T3;
        return v1 + v2; // t_fine
    }
    let _lastRawPress = 0;

    /**
     * Read the temperature in degrees Celsius.
     */
    //% blockId=bmp280_temperature block="BMP280 temperature (°C)" weight=90
    export function temperature(): number {
        ensure();
        const tFine = readFine();
        return tFine / 5120.0;
    }

    /**
     * Read the pressure in pascals (Pa). Divide by 100 for hPa / millibar.
     */
    //% blockId=bmp280_pressure block="BMP280 pressure (Pa)" weight=85
    export function pressure(): number {
        ensure();
        const tFine = readFine();
        const rawPress = _lastRawPress;
        let v1 = tFine / 2.0 - 64000.0;
        let v2 = v1 * v1 * P6 / 32768.0;
        v2 = v2 + v1 * P5 * 2.0;
        v2 = v2 / 4.0 + P4 * 65536.0;
        v1 = (P3 * v1 * v1 / 524288.0 + P2 * v1) / 524288.0;
        v1 = (1.0 + v1 / 32768.0) * P1;
        if (v1 == 0) return 0;
        let p = 1048576.0 - rawPress;
        p = (p - v2 / 4096.0) * 6250.0 / v1;
        v1 = P9 * p * p / 2147483648.0;
        v2 = p * P8 / 32768.0;
        p = p + (v1 + v2 + P7) / 16.0;
        return p; // Pa
    }

    /**
     * Estimate altitude in metres from the pressure, given sea-level pressure in hPa.
     * @param seaLevelhPa sea-level pressure in hPa, eg: 1013.25
     */
    //% blockId=bmp280_altitude block="BMP280 altitude (m)|sea level %seaLevelhPa|hPa"
    //% seaLevelhPa.defl=1013 weight=80
    export function altitude(seaLevelhPa: number = 1013.25): number {
        const hpa = pressure() / 100.0;
        // barometric formula
        return 44330.0 * (1.0 - Math.pow(hpa / seaLevelhPa, 0.1903));
    }
}
