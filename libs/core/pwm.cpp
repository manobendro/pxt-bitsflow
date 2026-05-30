#include "pxt.h"

// Native PWM + servo driver for the `pwm` shims (pwm.ts). On the RP2040 firmware
// build (PXT_RP2040) these drive real PWM slices via the pico-sdk hardware_pwm.
// On the host VM build there is no hardware, so calls log via DMESG.
//
// Keep exactly one //%-annotated definition per shim (PXT's annotation scanner is
// not a preprocessor); the platform split lives inside #ifdef bodies / helpers.

#ifdef PXT_RP2040
#include "hardware/pwm.h"
#include "hardware/gpio.h"
#include "hardware/clocks.h"

// Per-GPIO record of the current wrap (TOP) value, so analogWrite can scale the
// 0..1023 duty into the slice's chan_level. 0 means "not configured yet".
static uint16_t pinWrap[30];

static uint32_t sysHz() {
    uint32_t hz = clock_get_hz(clk_sys);
    return hz ? hz : 125000000u;
}

// Configure a pin's PWM slice for the given period (microseconds) and return the
// chosen wrap (TOP). Picks a clkdiv so wrap fits in 16 bits.
static uint16_t configurePeriod(int pin, uint32_t periodUs) {
    if (pin < 0 || pin > 29)
        return 0;
    uint32_t hz = sysHz();
    // total ticks for this period = hz * periodUs / 1e6
    // choose clkdiv so wrap = ticks/clkdiv <= 65535
    uint64_t ticks = (uint64_t)hz * periodUs / 1000000ull;
    float clkdiv = 1.0f;
    if (ticks > 65535ull)
        clkdiv = (float)ticks / 65535.0f;
    if (clkdiv < 1.0f)
        clkdiv = 1.0f;
    if (clkdiv > 255.0f)
        clkdiv = 255.0f;
    uint32_t wrap = (uint32_t)(ticks / (uint64_t)(clkdiv));
    if (wrap < 1)
        wrap = 1;
    if (wrap > 65535)
        wrap = 65535;

    uint slice = pwm_gpio_to_slice_num(pin);
    gpio_set_function(pin, GPIO_FUNC_PWM);
    pwm_set_clkdiv(slice, clkdiv);
    pwm_set_wrap(slice, (uint16_t)wrap);
    pwm_set_enabled(slice, true);
    pinWrap[pin] = (uint16_t)wrap;
    return (uint16_t)wrap;
}

// Ensure a pin has a PWM slice configured at the default ~1kHz period.
static uint16_t ensureDefault(int pin) {
    if (pin < 0 || pin > 29)
        return 0;
    if (!pinWrap[pin])
        return configurePeriod(pin, 1000); // ~1kHz default
    return pinWrap[pin];
}

static void setPulse(int pin, uint32_t pulseUs, uint16_t wrap) {
    if (pin < 0 || pin > 29 || !wrap)
        return;
    uint slice = pwm_gpio_to_slice_num(pin);
    uint chan = pwm_gpio_to_channel(pin);
    uint64_t level = (uint64_t)pulseUs * wrap / 20000ull; // pulse / 20ms * wrap
    if (level > wrap)
        level = wrap;
    pwm_set_chan_level(slice, chan, (uint16_t)level);
}
#endif

namespace pwm {

//%
void analogWritePin(int pin, int value) {
#ifdef PXT_RP2040
    if (value < 0)
        value = 0;
    if (value > 1023)
        value = 1023;
    uint16_t wrap = ensureDefault(pin);
    if (!wrap)
        return;
    uint slice = pwm_gpio_to_slice_num(pin);
    uint chan = pwm_gpio_to_channel(pin);
    uint32_t level = (uint32_t)value * wrap / 1023u;
    if (level > wrap)
        level = wrap;
    pwm_set_chan_level(slice, chan, (uint16_t)level);
#else
    DMESG("pwm.analogWritePin(%d, %d)", pin, value);
#endif
}

//%
void analogSetPeriod(int pin, int micros) {
#ifdef PXT_RP2040
    if (micros <= 0)
        return;
    configurePeriod(pin, (uint32_t)micros);
#else
    DMESG("pwm.analogSetPeriod(%d, %d)", pin, micros);
#endif
}

//%
void servoWritePin(int pin, int angle) {
#ifdef PXT_RP2040
    if (angle < 0)
        angle = 0;
    if (angle > 180)
        angle = 180;
    // angle 0..180 -> 500..2500us
    uint32_t pulseUs = 500u + (uint32_t)angle * 2000u / 180u;
    uint16_t wrap = configurePeriod(pin, 20000); // 20ms / 50Hz
    setPulse(pin, pulseUs, wrap);
#else
    DMESG("pwm.servoWritePin(%d, %d)", pin, angle);
#endif
}

//%
void servoSetPulse(int pin, int micros) {
#ifdef PXT_RP2040
    if (micros < 0)
        micros = 0;
    uint16_t wrap = configurePeriod(pin, 20000); // 20ms / 50Hz
    setPulse(pin, (uint32_t)micros, wrap);
#else
    DMESG("pwm.servoSetPulse(%d, %d)", pin, micros);
#endif
}

} // namespace pwm
