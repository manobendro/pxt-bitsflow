#include "pico/stdlib.h"
#include "hardware/gpio.h"
#include <string.h>
#include <stdlib.h>
#include "pxt.h"

extern "C" {
// Defined (extern "C") in core---vm/vmload.cpp; not declared in any header.
void pxt_vm_start_buffer(uint8_t *data, unsigned len);
}

// The PXT bytecode is flashed to a FIXED region, separate from this firmware, so a
// program can be updated without reflashing the firmware. The firmware reads it from
// memory-mapped XIP flash. Layout at BYTECODE_ADDR:
//   [ 'P''X''T''B' ][ uint32 size, little-endian ][ size bytes of .pxt64 ... ]
#define BYTECODE_ADDR 0x10100000u          // 1 MB into flash; firmware is ~235 KB
#define BYTECODE_DATA (BYTECODE_ADDR + 8u) // bytecode starts after the 8-byte header
#define BYTECODE_MAX (1024u * 1024u)       // sanity bound on program size

static void errorBlink(const char *msg) {
    printf("PANIC: %s\n", msg);
    const uint LED = 15; // fast blink = "no/invalid program" (distinct from a program's blink)
    gpio_init(LED);
    gpio_set_dir(LED, GPIO_OUT);
    while (true) {
        gpio_put(LED, 1);
        busy_wait_us(100000);
        gpio_put(LED, 0);
        busy_wait_us(100000);
    }
}

int main() {
    stdio_init_all();
    busy_wait_us(1500ull * 1000); // give USB CDC a moment to enumerate

    printf("Bitsflow PXT VM for RP2040\n");

    const uint8_t *hdr = (const uint8_t *)BYTECODE_ADDR;
    if (!(hdr[0] == 'P' && hdr[1] == 'X' && hdr[2] == 'T' && hdr[3] == 'B'))
        errorBlink("no PXT program at 0x10100000 (flash a program .uf2)");

    uint32_t size;
    memcpy(&size, hdr + 4, 4); // RP2040 is little-endian
    if (size == 0 || size > BYTECODE_MAX)
        errorBlink("invalid PXT program size");

    printf("loading program: %u bytes\n", (unsigned)size);

    // The VM patches the image in place, so copy it from flash into RAM first.
    uint8_t *img = (uint8_t *)malloc(size + 16);
    if (!img)
        errorBlink("cannot allocate VM image buffer");
    memcpy(img, (const void *)BYTECODE_DATA, size);

    pxt_vm_start_buffer(img, size);

    while (true) tight_loop_contents();
}
