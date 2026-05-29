#include "pico/stdlib.h"
#include <string.h>
#include <stdlib.h>
#include "pxt.h"

extern "C" {
extern const unsigned char bitsflow_vm_image[];
extern const unsigned int bitsflow_vm_image_len;
// Defined (extern "C") in core---vm/vmload.cpp; not declared in any header.
void pxt_vm_start_buffer(uint8_t *data, unsigned len);
}

int main() {
    stdio_init_all();
    busy_wait_us(1500ull * 1000); // give USB CDC a moment to enumerate (pico-specific; avoids the VM's sleep_ms)

    printf("Bitsflow PXT VM for RP2040\n");
    printf("loading embedded image: %u bytes\n", bitsflow_vm_image_len);

    auto img = (uint8_t *)malloc(bitsflow_vm_image_len + 8);
    if (!img) {
        printf("PANIC: cannot allocate VM image buffer\n");
        while (true) tight_loop_contents();
    }
    memcpy(img, bitsflow_vm_image, bitsflow_vm_image_len);
    pxt_vm_start_buffer(img, bitsflow_vm_image_len);

    while (true) tight_loop_contents();
}
