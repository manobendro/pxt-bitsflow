#include "pxt.h"

#ifdef PXT_RP2040
#include "hardware/pwm.h"
#include "hardware/gpio.h"
#include "hardware/clocks.h"

#ifndef MUSIC_SYS_CLK_HZ_FALLBACK
#define MUSIC_SYS_CLK_HZ_FALLBACK 125000000u
#endif

static uint32_t music_sys_clk_hz() {
    uint32_t hz = clock_get_hz(clk_sys);
    if (hz == 0)
        hz = MUSIC_SYS_CLK_HZ_FALLBACK;
    return hz;
}
#endif

namespace music {

/**
 * Play (or stop) a square-wave tone on a pin using RP2040 hardware PWM.
 * frequency 0 (or negative) turns the tone off.
 */
//%
void tonePin(int pin, int frequency) {
#ifdef PXT_RP2040
    uint slice = pwm_gpio_to_slice_num((uint)pin);
    uint chan = pwm_gpio_to_channel((uint)pin);

    if (frequency <= 0) {
        pwm_set_enabled(slice, false);
        return;
    }

    gpio_set_function((uint)pin, GPIO_FUNC_PWM);

    uint32_t sysclk = music_sys_clk_hz();

    // Choose a clock divider so that wrap fits in 16 bits.
    // sysclk / (clkdiv * wrap) = frequency  ->  wrap = sysclk / (clkdiv * frequency)
    float clkdiv = (float)sysclk / ((float)frequency * 65535.0f);
    if (clkdiv < 1.0f)
        clkdiv = 1.0f;
    if (clkdiv > 255.0f)
        clkdiv = 255.0f;

    uint32_t wrap = (uint32_t)((float)sysclk / (clkdiv * (float)frequency));
    if (wrap < 2)
        wrap = 2;
    if (wrap > 65535)
        wrap = 65535;

    pwm_set_clkdiv(slice, clkdiv);
    pwm_set_wrap(slice, (uint16_t)(wrap - 1));
    pwm_set_chan_level(slice, chan, (uint16_t)(wrap / 2)); // 50% duty
    pwm_set_enabled(slice, true);
#else
    DMESG("music.tonePin %d %d", pin, frequency);
#endif
}

} // namespace music
