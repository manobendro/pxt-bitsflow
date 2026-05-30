#include "pxt.h"

// Native driver for the neopixel shims (neopixel.ts):
//   - sendBuffer  : WS2812/NeoPixel — one data pin, strict 800kHz timing
//   - sendDotStar : APA102/DotStar  — data + clock pins, clocked (no timing constraint)
//
// On RP2040 WS2812 timing is generated in hardware by a PIO state machine; APA102 is
// bit-banged on GPIO (it's clocked, so timing is relaxed). On the host VM there's no
// hardware, so both just log.

#ifdef PXT_RP2040
#include "hardware/pio.h"
#include "hardware/clocks.h"
#include "hardware/gpio.h"
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

// APA102/DotStar: bit-bang the raw stream MSB-first on data, pulsing clock per bit.
static bool apa_inited;
static int apa_data = -1, apa_clk = -1;
static void apa102_init(int dataPin, int clkPin) {
    if (!apa_inited || apa_data != dataPin || apa_clk != clkPin) {
        gpio_init(dataPin);
        gpio_set_dir(dataPin, GPIO_OUT);
        gpio_init(clkPin);
        gpio_set_dir(clkPin, GPIO_OUT);
        gpio_put(clkPin, 0);
        apa_data = dataPin;
        apa_clk = clkPin;
        apa_inited = true;
    }
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

//%
void sendDotStar(int dataPin, int clkPin, Buffer buf) {
#ifdef PXT_RP2040
    if (!buf || buf->length == 0)
        return;
    apa102_init(dataPin, clkPin);
    const uint8_t *p = buf->data;
    int len = buf->length;
    for (int i = 0; i < len; i++) {
        uint8_t v = p[i];
        for (uint8_t mask = 0x80; mask; mask >>= 1) {
            gpio_put(dataPin, (v & mask) ? 1 : 0);
            gpio_put(clkPin, 1);
            gpio_put(clkPin, 0);
        }
    }
#else
    (void)dataPin;
    (void)clkPin;
    if (buf)
        DMESG("dotstar: %d bytes -> data %d clk %d", buf->length, dataPin, clkPin);
#endif
}

} // namespace neopixel
