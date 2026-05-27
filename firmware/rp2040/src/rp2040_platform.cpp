#include "pico/stdlib.h"
#include "hardware/sync.h"
#include "hardware/watchdog.h"
#include "pxt.h"

namespace pxt {

static uint32_t irq_state;
static int irq_depth;

void target_disable_irq() {
    if (irq_depth++ == 0)
        irq_state = save_and_disable_interrupts();
}

void target_enable_irq() {
    if (irq_depth <= 0) return;
    if (--irq_depth == 0)
        restore_interrupts(irq_state);
}

void sendSerial(const char *data, int len) {
    for (int i = 0; i < len; ++i)
        putchar_raw(data[i]);
}

extern "C" void drawPanic(int code) {
    printf("\nPANIC %d\n", code);
}

extern "C" void target_init() {
    seedRandom((unsigned)time_us_32());
}

void updateScreen(Image_ img) {
    (void)img;
}

} // namespace pxt
