#include "pxt.h"

// Native UART for the `uart` shims (uart.ts). This is a SECOND serial bus, separate
// from console.log (which uses USB + the stdio UART). The RP2040 UART peripheral
// (uart0/uart1) is chosen from the TX pin. Host VM build logs via DMESG.

#ifdef PXT_RP2040
#include "hardware/uart.h"
#include "hardware/gpio.h"

// RP2040 pinmux for UART (by 4-pin group): GP0-3,12-19,28 -> uart0 ; GP4-11,20-27 -> uart1.
// group = gpio/4 ; instance = ((group+1)/2) & 1.
static uart_inst_t *uart_for(int gpio) {
    int group = gpio >> 2;
    return (((group + 1) >> 1) & 1) ? uart1 : uart0;
}

static uart_inst_t *uartDev;
static int uartBaud = 9600;
#endif

namespace uart {

//%
void init(int tx, int rx, int baud) {
#ifdef PXT_RP2040
    uartBaud = baud;
    uartDev = uart_for(tx);
    uart_init(uartDev, baud); // 8N1 by default
    gpio_set_function(tx, GPIO_FUNC_UART);
    gpio_set_function(rx, GPIO_FUNC_UART);
#else
    DMESG("uart.init tx=%d rx=%d baud=%d", tx, rx, baud);
#endif
}

//%
void setBaudRate(int baud) {
#ifdef PXT_RP2040
    uartBaud = baud;
    if (uartDev)
        uart_set_baudrate(uartDev, baud);
#else
    DMESG("uart.setBaudRate %d", baud);
#endif
}

//%
void writeBuffer(Buffer buf) {
#ifdef PXT_RP2040
    if (uartDev && buf && buf->length > 0)
        uart_write_blocking(uartDev, buf->data, buf->length);
#else
    DMESG("uart.writeBuffer len=%d", buf ? buf->length : 0);
#endif
}

//%
Buffer readBuffer(int size) {
    if (size < 0)
        size = 0;
#ifdef PXT_RP2040
    Buffer buf = mkBuffer(NULL, size);
    if (uartDev && size > 0)
        uart_read_blocking(uartDev, buf->data, size);
    return buf;
#else
    DMESG("uart.readBuffer size=%d", size);
    return mkBuffer(NULL, size);
#endif
}

//%
int available() {
#ifdef PXT_RP2040
    if (!uartDev)
        return 0;
    return uart_is_readable(uartDev) ? 1 : 0;
#else
    return 0;
#endif
}

} // namespace uart
