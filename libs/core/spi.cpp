#include "pxt.h"

// Native SPI master for the `spi` shims (spi.ts). One active bus; the RP2040 SPI
// peripheral (spi0/spi1) is chosen from the SCK pin. On the host VM there's no
// hardware, so calls log via DMESG and reads return 0.

#ifdef PXT_RP2040
#include "hardware/spi.h"
#include "hardware/gpio.h"

// RP2040 pinmux: SPI instance for a GPIO = (gpio / 8) & 1.
//   spi0: GP0-7 & GP16-23 ; spi1: GP8-15 & GP24-29
static spi_inst_t *spi_for(int gpio) {
    return ((gpio >> 3) & 1) ? spi1 : spi0;
}

static spi_inst_t *spiDev;
static int spiFreq = 1000000;
#endif

namespace spi {

//%
void init(int sck, int mosi, int miso) {
#ifdef PXT_RP2040
    spiDev = spi_for(sck);
    spi_init(spiDev, spiFreq);
    gpio_set_function(sck, GPIO_FUNC_SPI);
    gpio_set_function(mosi, GPIO_FUNC_SPI);
    gpio_set_function(miso, GPIO_FUNC_SPI);
#else
    DMESG("spi.init sck=%d mosi=%d miso=%d", sck, mosi, miso);
#endif
}

//%
int write(int value) {
#ifdef PXT_RP2040
    if (!spiDev)
        return 0;
    uint8_t tx = (uint8_t)value, rx = 0;
    spi_write_read_blocking(spiDev, &tx, &rx, 1);
    return rx;
#else
    DMESG("spi.write %d", value);
    return 0;
#endif
}

//%
void transfer(Buffer command, Buffer response) {
#ifdef PXT_RP2040
    if (!spiDev)
        return;
    int len = command ? command->length : (response ? response->length : 0);
    if (len <= 0)
        return;
    const uint8_t *tx = command ? command->data : NULL;
    uint8_t *rx = response ? response->data : NULL;
    if (tx && rx)
        spi_write_read_blocking(spiDev, tx, rx, len);
    else if (tx)
        spi_write_blocking(spiDev, tx, len);
    else
        spi_read_blocking(spiDev, 0, rx, len);
#else
    DMESG("spi.transfer cmd=%d resp=%d", command ? command->length : 0,
          response ? response->length : 0);
#endif
}

//%
void setFrequency(int hz) {
#ifdef PXT_RP2040
    spiFreq = hz;
    if (spiDev)
        spi_set_baudrate(spiDev, hz);
#else
    DMESG("spi.setFrequency %d", hz);
#endif
}

//%
void setMode(int mode) {
#ifdef PXT_RP2040
    if (!spiDev)
        return;
    spi_cpol_t cpol = (mode & 2) ? SPI_CPOL_1 : SPI_CPOL_0;
    spi_cpha_t cpha = (mode & 1) ? SPI_CPHA_1 : SPI_CPHA_0;
    spi_set_format(spiDev, 8, cpol, cpha, SPI_MSB_FIRST);
#else
    DMESG("spi.setMode %d", mode);
#endif
}

} // namespace spi
