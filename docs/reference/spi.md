# SPI

Communicate with SPI devices as the bus master on the Raspberry Pi Pico (RP2040).

SPI is a synchronous serial protocol that uses a clock (SCK) plus separate data
lines for sending (MOSI) and receiving (MISO). Use the ``||spi:spi||`` namespace
to drive sensors, displays, and other peripherals.

The hardware SPI peripheral instance (``spi0`` or ``spi1``) is auto-selected from
the pins you pass to [init](/reference/spi/init). Only one SPI bus can be active at
a time. In the simulator, SPI activity is logged to the console.

## init

Initialize the SPI bus on the given pins. The bus starts at 1 MHz using SPI mode 0.

```sig
spi.init(DigitalPin.P18, DigitalPin.P19, DigitalPin.P16)
```

### Parameters

* **sck**: the clock pin (default ``P18``).
* **mosi**: the controller-out / peripheral-in data pin (default ``P19``).
* **miso**: the controller-in / peripheral-out data pin (default ``P16``).

### Example

```blocks
spi.init(DigitalPin.P18, DigitalPin.P19, DigitalPin.P16)
```

## write

Write one byte to the bus and return the byte that is read back at the same time.

```sig
spi.write(0)
```

### Parameters

* **value**: the byte to send, from 0 to 255.

### Returns

* a [number](/types/number) from 0 to 255: the byte received while writing.

### Example

```blocks
spi.init(DigitalPin.P18, DigitalPin.P19, DigitalPin.P16)
let r = spi.write(0xAB)
```

## transfer

Transfer a buffer to the device while receiving into another buffer. The bytes are
sent and received at the same time. Either buffer may be ``null``.

```sig
spi.transfer(null, null)
```

### Parameters

* **command**: the [Buffer](/types/buffer) of bytes to send, or ``null`` to send zeros.
* **response**: the [Buffer](/types/buffer) to fill with received bytes, or ``null`` to ignore the response.

### Example

```blocks
spi.init(DigitalPin.P18, DigitalPin.P19, DigitalPin.P16)
let cmd = control.createBuffer(2)
let resp = control.createBuffer(2)
spi.transfer(cmd, resp)
```

## setFrequency

Set the SPI clock frequency in hertz.

```sig
spi.setFrequency(1000000)
```

### Parameters

* **hz**: the clock frequency in hertz, for example ``1000000`` for 1 MHz.

### Example

```blocks
spi.init(DigitalPin.P18, DigitalPin.P19, DigitalPin.P16)
spi.setFrequency(4000000)
```

## setMode

Set the SPI mode, which selects the clock polarity and phase.

```sig
spi.setMode(0)
```

### Parameters

* **mode**: the SPI mode, from 0 to 3.

### Example

```blocks
spi.init(DigitalPin.P18, DigitalPin.P19, DigitalPin.P16)
spi.setMode(3)
```

## Example

Set up the bus, configure it, and exchange a byte.

```blocks
spi.init(DigitalPin.P18, DigitalPin.P19, DigitalPin.P16)
spi.setFrequency(2000000)
spi.setMode(0)
let result = spi.write(0x9F)
```
