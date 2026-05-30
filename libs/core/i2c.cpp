#include "pxt.h"

// Native I2C master for the `i2c` shims (i2c.ts). One active bus; the RP2040 I2C
// peripheral (i2c0/i2c1) is chosen from the SDA pin. On the host VM there's no
// hardware, so calls log via DMESG and reads return an empty buffer.

#ifdef PXT_RP2040
#include "hardware/i2c.h"
#include "hardware/gpio.h"

// RP2040 pinmux: I2C instance for a GPIO = (gpio / 2) & 1.
//   i2c0: GP0/1, GP4/5, GP8/9, ... ; i2c1: GP2/3, GP6/7, GP10/11, ...
static i2c_inst_t *i2c_for(int gpio) {
    return ((gpio >> 1) & 1) ? i2c1 : i2c0;
}

static i2c_inst_t *i2cDev;
static int i2cFreq = 100000;
#endif

namespace i2c {

//%
void init(int sda, int scl) {
#ifdef PXT_RP2040
    i2cDev = i2c_for(sda);
    i2c_init(i2cDev, i2cFreq);
    gpio_set_function(sda, GPIO_FUNC_I2C);
    gpio_set_function(scl, GPIO_FUNC_I2C);
    gpio_pull_up(sda);
    gpio_pull_up(scl);
#else
    DMESG("i2c.init sda=%d scl=%d", sda, scl);
#endif
}

//%
void setFrequency(int hz) {
#ifdef PXT_RP2040
    i2cFreq = hz;
    if (i2cDev)
        i2c_set_baudrate(i2cDev, hz);
#else
    DMESG("i2c.setFrequency %d", hz);
#endif
}

//%
Buffer readBuffer(int address, int size, bool repeated) {
    if (size < 0)
        size = 0;
#ifdef PXT_RP2040
    Buffer buf = mkBuffer(NULL, size);
    if (i2cDev && size > 0)
        i2c_read_blocking(i2cDev, (uint8_t)address, buf->data, size, repeated);
    return buf;
#else
    DMESG("i2c.readBuffer addr=%d size=%d", address, size);
    return mkBuffer(NULL, size);
#endif
}

//%
void writeBuffer(int address, Buffer buf, bool repeated) {
#ifdef PXT_RP2040
    if (i2cDev && buf && buf->length > 0)
        i2c_write_blocking(i2cDev, (uint8_t)address, buf->data, buf->length, repeated);
#else
    DMESG("i2c.writeBuffer addr=%d len=%d", address, buf ? buf->length : 0);
#endif
}

} // namespace i2c
