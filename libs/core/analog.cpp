#include "pxt.h"

#ifdef PXT_RP2040
#include "pico/stdlib.h"
#include "hardware/adc.h"

// Lazily initialize the ADC hardware exactly once.
static void ensureAdcInit() {
    static bool inited = false;
    if (!inited) {
        adc_init();
        inited = true;
    }
}

// Configure the given GPIO for ADC, select its channel and read the raw value.
// Valid pins are GP26..GP29 -> ADC channels 0..3 (channel = gpio - 26).
// Returns the raw 12-bit reading (0..4095), or 0 if the pin is invalid.
static int adcReadRaw(int pin) {
    if (pin < 26 || pin > 29)
        return 0;
    ensureAdcInit();
    adc_gpio_init((uint)pin);
    adc_select_input((uint)(pin - 26));
    return (int)adc_read();
}
#endif

/**
 * Read analog (ADC) values from pins.
 */
//% color=#B80000 weight=29
namespace analog {

/**
 * Read the connector value as analog, scaled to 0..1023.
 */
//%
int analogReadPin(int pin) {
#ifdef PXT_RP2040
    return adcReadRaw(pin) >> 2;
#else
    DMESG("analogReadPin(%d) [host stub]", pin);
    return 0;
#endif
}

/**
 * Read the raw 12-bit ADC value (0..4095).
 */
//%
int analogReadRaw(int pin) {
#ifdef PXT_RP2040
    return adcReadRaw(pin);
#else
    DMESG("analogReadRaw(%d) [host stub]", pin);
    return 0;
#endif
}

/**
 * Read the connector value in millivolts (assuming a 3.3V reference).
 */
//%
int analogReadMillivolts(int pin) {
#ifdef PXT_RP2040
    return adcReadRaw(pin) * 3300 / 4095;
#else
    DMESG("analogReadMillivolts(%d) [host stub]", pin);
    return 0;
#endif
}

}
