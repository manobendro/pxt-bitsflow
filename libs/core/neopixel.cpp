#include "pxt.h"

// Native WS2812 / NeoPixel driver for the `neopixel.sendBuffer` shim (neopixel.ts).
//
// On RP2040 the strict 800kHz WS2812 timing is generated in hardware by a PIO state
// machine (no IRQ juggling needed). On the host VM there's no hardware, so it just logs.

#ifdef PXT_RP2040
#include "hardware/pio.h"
#include "hardware/clocks.h"
#include "pico/time.h" // busy_wait_us

// WS2812 PIO program (800kHz), assembled from the pico-sdk ws2812.pio example.
// 10 cycles/bit (T1=2, T2=5, T3=3); one side-set bit drives the data line.
#define WS2812_CYCLES 10
static const uint16_t ws2812_instructions[] = {
    0x6221, // 0: out  x, 1   side 0 [2]
    0x1123, // 1: jmp  !x, 3  side 1 [1]
    0x1400, // 2: jmp  0      side 1 [4]
    0xa442, // 3: nop         side 0 [4]
};
static const pio_program_t ws2812_program = {
    .instructions = ws2812_instructions,
    .length = 4,
    .origin = -1,
};

static PIO ws2812_pio = pio0;
static int ws2812_sm = -1;
static uint ws2812_offset = 0;
static int ws2812_pin = -1;

static void ws2812_init(int pin) {
    if (ws2812_sm < 0) {
        ws2812_sm = pio_claim_unused_sm(ws2812_pio, true);
        ws2812_offset = pio_add_program(ws2812_pio, &ws2812_program);
    } else {
        pio_sm_set_enabled(ws2812_pio, ws2812_sm, false);
    }

    pio_gpio_init(ws2812_pio, pin);
    pio_sm_set_consecutive_pindirs(ws2812_pio, ws2812_sm, pin, 1, true);

    pio_sm_config c = pio_get_default_sm_config();
    sm_config_set_wrap(&c, ws2812_offset, ws2812_offset + 3);
    sm_config_set_sideset(&c, 1, false, false);
    sm_config_set_sideset_pins(&c, pin);
    // shift left (MSB first), autopull, 24 bits per pixel
    sm_config_set_out_shift(&c, false, true, 24);
    sm_config_set_fifo_join(&c, PIO_FIFO_JOIN_TX);
    float div = (float)clock_get_hz(clk_sys) / (800000.0f * WS2812_CYCLES);
    sm_config_set_clkdiv(&c, div);

    pio_sm_init(ws2812_pio, ws2812_sm, ws2812_offset, &c);
    pio_sm_set_enabled(ws2812_pio, ws2812_sm, true);
    ws2812_pin = pin;
}
#endif

namespace neopixel {

//%
void sendBuffer(int pin, Buffer buf) {
#ifdef PXT_RP2040
    if (!buf || buf->length < 3)
        return;
    if (ws2812_pin != pin)
        ws2812_init(pin);
    int n = buf->length - (buf->length % 3);
    for (int i = 0; i < n; i += 3) {
        uint32_t grb = ((uint32_t)buf->data[i] << 16) | ((uint32_t)buf->data[i + 1] << 8) |
                       (uint32_t)buf->data[i + 2];
        pio_sm_put_blocking(ws2812_pio, ws2812_sm, grb << 8u);
    }
    busy_wait_us(60); // latch: WS2812 needs >50us of low to show the new colors
#else
    (void)pin;
    if (buf)
        DMESG("neopixel: %d bytes -> pin %d", buf->length, pin);
#endif
}

} // namespace neopixel
