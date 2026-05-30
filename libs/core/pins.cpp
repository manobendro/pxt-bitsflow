#include "pxt.h"

// Native implementation of the `pins` digital GPIO shims declared in pins.ts.
//
// On the RP2040 firmware build (PXT_RP2040) these drive real GPIOs via the pico-sdk.
// On the host VM build (pxt-vm-cli) there is no hardware, so they report activity via
// DMESG and reads return 0.
//
// Keep exactly one //%-annotated definition per shim (PXT's annotation scanner is not a
// preprocessor); the platform split lives inside helpers / #ifdef bodies.

#ifdef PXT_RP2040
#include "hardware/gpio.h"

// Track which pins have had gpio_init() called (RP2040 has GPIO 0..29).
static uint32_t pinInited;
static void ensurePin(int pin) {
    if (pin < 0 || pin > 29)
        return;
    if (!(pinInited & (1u << pin))) {
        gpio_init(pin);
        pinInited |= (1u << pin);
    }
}
#endif

namespace pins {

//%
void digitalWritePin(int name, int value) {
#ifdef PXT_RP2040
    ensurePin(name);
    gpio_set_dir(name, GPIO_OUT);
    gpio_put(name, value ? 1 : 0);
#else
    DMESG("digitalWritePin(%d, %d)", name, value);
#endif
}

//%
int digitalReadPin(int name) {
#ifdef PXT_RP2040
    ensurePin(name);
    gpio_set_dir(name, GPIO_IN);
    return gpio_get(name) ? 1 : 0;
#else
    DMESG("digitalReadPin(%d)", name);
    return 0;
#endif
}

//%
void setPull(int name, int pull) {
#ifdef PXT_RP2040
    ensurePin(name);
    // PinPullMode (from enums.d.ts): PullDown=0, PullUp=1, PullNone=2
    gpio_set_pulls(name, pull == 1 /*up*/, pull == 0 /*down*/);
#else
    DMESG("setPull(%d, %d)", name, pull);
#endif
}

} // namespace pins
