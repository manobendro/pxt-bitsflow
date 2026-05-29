#include "pxt.h"

// Native implementation of the `led` shims declared in led.ts.
//
// On the RP2040 firmware build (PXT_RP2040 defined by firmware/rp2040/CMakeLists.txt)
// these drive a real GPIO. On the host VM build (pxt-vm-cli) there is no hardware, so
// they report the LED state via DMESG, which the host runtime prints — handy for
// validating a program before flashing.
//
// NOTE: keep exactly one //%-annotated definition per shim. PXT's annotation scanner
// is not a real preprocessor, so the platform split lives inside applyLed(), not in
// duplicated #ifdef'd function bodies.

#ifdef PXT_RP2040
#include "hardware/gpio.h"
// External LED: wire  GPIO -> ~330ohm resistor -> LED(+)  and  LED(-) -> GND.
// Change this to match your wiring (e.g. 25 for the classic Pico onboard LED).
#ifndef BITSFLOW_LED_PIN
#define BITSFLOW_LED_PIN 15
#endif
#endif

namespace led {

static bool ledState;

#ifdef PXT_RP2040
static bool ledInited;
static void applyLed() {
    if (!ledInited) {
        gpio_init(BITSFLOW_LED_PIN);
        gpio_set_dir(BITSFLOW_LED_PIN, GPIO_OUT);
        ledInited = true;
    }
    gpio_put(BITSFLOW_LED_PIN, ledState ? 1 : 0);
}
#else
static void applyLed() {
    DMESG("LED %s", ledState ? "on" : "off");
}
#endif

//%
void on() {
    ledState = true;
    applyLed();
}

//%
void off() {
    ledState = false;
    applyLed();
}

//%
void toggle() {
    ledState = !ledState;
    applyLed();
}

} // namespace led
