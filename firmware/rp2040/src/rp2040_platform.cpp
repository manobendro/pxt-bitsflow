#include "pico/stdlib.h"
#include "hardware/sync.h"
#include "hardware/watchdog.h"
#include "pxt.h"
#include <sys/time.h>
#include <time.h>

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

// Normally provided by the linux platform.cpp (excluded here). No display on this board.
void screen_init() {
    updateScreen(NULL);
}

} // namespace pxt

// vmcache (on-disk image cache) is excluded from the firmware, but pointers.cpp still
// emits wrappers for its shims. Provide no-op stubs so the link resolves; the blink
// program never calls them.
namespace vmcache {
RefCollection *list() { return NULL; }
void run(String name) { (void)name; }
void del(String name) { (void)name; }
} // namespace vmcache

// --- newlib syscalls the VM scheduler relies on -------------------------------
// scheduler.cpp uses gettimeofday() for the clock and nanosleep() for short busy
// waits between fibers. newlib's defaults are stubs; back them with the RP2040 timer.
extern "C" int _gettimeofday(struct timeval *tv, void *tz) {
    (void)tz;
    if (tv) {
        uint64_t us = to_us_since_boot(get_absolute_time());
        tv->tv_sec = (time_t)(us / 1000000ULL);
        tv->tv_usec = (suseconds_t)(us % 1000000ULL);
    }
    return 0;
}

extern "C" int nanosleep(const struct timespec *req, struct timespec *rem) {
    (void)rem;
    if (req) {
        uint64_t us = (uint64_t)req->tv_sec * 1000000ULL + (uint64_t)req->tv_nsec / 1000ULL;
        if (us)
            busy_wait_us(us);
    }
    return 0;
}
