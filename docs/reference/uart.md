# UART

Send and receive bytes over a serial (UART) bus on the Raspberry Pi Pico (RP2040).

UART is an asynchronous serial protocol with separate transmit (TX) and receive
(RX) lines. Use the ``||uart:uart||`` namespace to talk to GPS modules, Bluetooth
modules, and other serial peripherals.

This is a **second** serial bus, separate from
[console.log](/reference/console/log), which uses USB together with the standard
stdio UART. The hardware UART peripheral instance (``uart0`` or ``uart1``) is
auto-selected from the pins you pass to [init](/reference/uart/init). Only one
UART bus can be active at a time. In the simulator, UART activity is logged to the
console.

## init

Initialize the UART bus on the given pins. The bus starts at 9600 baud unless you
pass a different baud rate.

```sig
uart.init(DigitalPin.P8, DigitalPin.P9)
```

### Parameters

* **tx**: the transmit pin (default ``P8``).
* **rx**: the receive pin (default ``P9``).
* **baud**: optional baud rate (default ``9600``).

### Example

```blocks
uart.init(DigitalPin.P8, DigitalPin.P9, 115200)
```

## setBaudRate

Set the baud rate of the UART bus.

```sig
uart.setBaudRate(9600)
```

### Parameters

* **baud**: the baud rate, for example ``115200``.

### Example

```blocks
uart.init(DigitalPin.P8, DigitalPin.P9)
uart.setBaudRate(115200)
```

## writeString

Write a string of text to the bus.

```sig
uart.writeString("")
```

### Parameters

* **text**: the [string](/types/string) to send.

### Example

```blocks
uart.init(DigitalPin.P8, DigitalPin.P9, 115200)
uart.writeString("hello\n")
```

## writeBuffer

Write a buffer of bytes to the bus.

```sig
uart.writeBuffer(null)
```

### Parameters

* **buf**: the [Buffer](/types/buffer) of bytes to send.

### Example

```blocks
uart.init(DigitalPin.P8, DigitalPin.P9, 115200)
let out = control.createBuffer(2)
out.setUint8(0, 0x01)
out.setUint8(1, 0x02)
uart.writeBuffer(out)
```

## readBuffer

Read exactly a number of bytes from the bus. This blocks until that many bytes
have been received.

```sig
uart.readBuffer(0)
```

### Parameters

* **size**: the number of bytes to read.

### Returns

* a [Buffer](/types/buffer) of length **size** containing the bytes that were read.

### Example

```blocks
uart.init(DigitalPin.P8, DigitalPin.P9, 115200)
let data = uart.readBuffer(4)
```

## available

Return the number of bytes that are available to read without blocking.

```sig
uart.available()
```

### Returns

* a [number](/types/number), 0 or more, of bytes ready to read.

### Example

```blocks
uart.init(DigitalPin.P8, DigitalPin.P9, 115200)
if (uart.available() > 0) {
    let b = uart.readBuffer(1)
}
```

## Example

Initialize at 115200 baud, send a message, then read a byte if one is available.

```blocks
uart.init(DigitalPin.P8, DigitalPin.P9, 115200)
uart.writeString("ping\n")
if (uart.available() > 0) {
    let reply = uart.readBuffer(1)
}
```
