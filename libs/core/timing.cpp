#include "pxt.h"

#ifdef PXT_RP2040
#include "hardware/gpio.h"
#include "pico/time.h"
#endif

namespace timing {

/**
 * Measure how long (in microseconds) a pin stays at the given level.
 * Waits for the level to start, then times until it ends, bounded by maxDurationUs.
 * Returns the duration in microseconds, or 0 on timeout.
 */
//%
int pulseIn(int pin, int value, int maxDurationUs) {
#ifdef PXT_RP2040
    gpio_init(pin);
    gpio_set_dir(pin, GPIO_IN);

    uint64_t start = time_us_64();

    // (1) wait for the pulse to start
    while (gpio_get(pin) != value) {
        if (time_us_64() - start >= (uint64_t)maxDurationUs)
            return 0;
    }

    // (2) record the pulse start time
    uint64_t t0 = time_us_64();

    // (3) wait while the pin stays at value, bounded by maxDurationUs
    while (gpio_get(pin) == value) {
        if (time_us_64() - start >= (uint64_t)maxDurationUs)
            break;
    }

    // (4) elapsed time, capped at maxDurationUs
    uint64_t elapsed = time_us_64() - t0;
    if (elapsed > (uint64_t)maxDurationUs)
        elapsed = (uint64_t)maxDurationUs;
    return (int)elapsed;
#else
    DMESG("timing::pulseIn not implemented on host");
    return 0;
#endif
}

/**
 * Return the number of microseconds since boot (low 31 bits).
 */
//%
int micros() {
#ifdef PXT_RP2040
    return (int)(time_us_64() & 0x7fffffff);
#else
    return 0;
#endif
}

/**
 * Busy-wait for the given number of microseconds.
 */
//%
void delayMicros(int us) {
#ifdef PXT_RP2040
    if (us > 0)
        busy_wait_us(us);
#else
    DMESG("timing::delayMicros not implemented on host");
#endif
}

}
