#include "pico/stdlib.h"
#include <string.h>
#include <stdlib.h>
#include "pxt.h"

extern "C" {
extern const unsigned char bitsflow_vm_image[];
extern const unsigned int bitsflow_vm_image_len;
}

int main() {
    stdio_init_all();
    sleep_ms(1500); // give USB CDC a moment to enumerate

    printf("Bitsflow PXT VM for RP2040\n");
    printf("loading embedded image: %u bytes\n", bitsflow_vm_image_len);

    auto img = (uint8_t *)malloc(bitsflow_vm_image_len + 8);
    if (!img) {
        printf("PANIC: cannot allocate VM image buffer\n");
        while (true) tight_loop_contents();
    }
    memcpy(img, bitsflow_vm_image, bitsflow_vm_image_len);
    pxt::pxt_vm_start_buffer(img, bitsflow_vm_image_len);

    while (true) tight_loop_contents();
}
