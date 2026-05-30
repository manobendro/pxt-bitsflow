# I2C

Communicate with I2C devices as the bus master on the Raspberry Pi Pico (RP2040).

I2C is a two-wire serial protocol that uses a data line (SDA) and a clock line
(SCL) shared by many devices, each with its own 7-bit address. Use the
``||i2c:i2c||`` namespace to read from and write to sensors and other peripherals.

The hardware I2C peripheral instance (``i2c0`` or ``i2c1``) is auto-selected from
the pins you pass to [init](/reference/i2c/init). Only one I2C bus can be active at
a time. In the simulator, I2C activity is logged to the console.

## init

Initialize the I2C bus on the given pins. The bus starts at 100 kHz with the
internal pull-up resistors enabled.

```sig
i2c.init(DigitalPin.P4, DigitalPin.P5)
```

### Parameters

* **sda**: the data pin (default ``P4``).
* **scl**: the clock pin (default ``P5``).

### Example

```blocks
i2c.init(DigitalPin.P4, DigitalPin.P5)
```

## setFrequency

Set the I2C clock frequency in hertz.

```sig
i2c.setFrequency(100000)
```

### Parameters

* **hz**: the clock frequency in hertz, for example ``400000`` for 400 kHz.

### Example

```blocks
i2c.init(DigitalPin.P4, DigitalPin.P5)
i2c.setFrequency(400000)
```

## readBuffer

Read a number of bytes from a device at a 7-bit address.

```sig
i2c.readBuffer(0, 0)
```

### Parameters

* **address**: the 7-bit device address.
* **size**: the number of bytes to read.
* **repeated**: optional; if ``true``, send a repeated start instead of a stop after the read.

### Returns

* a [Buffer](/types/buffer) containing the bytes that were read.

### Example

```blocks
i2c.init(DigitalPin.P4, DigitalPin.P5)
let data = i2c.readBuffer(0x3c, 2)
```

## writeBuffer

Write a buffer of bytes to a device at a 7-bit address.

```sig
i2c.writeBuffer(0, null)
```

### Parameters

* **address**: the 7-bit device address.
* **buf**: the [Buffer](/types/buffer) of bytes to send.
* **repeated**: optional; if ``true``, send a repeated start instead of a stop after the write.

### Example

```blocks
i2c.init(DigitalPin.P4, DigitalPin.P5)
let cmd = control.createBuffer(1)
cmd.setUint8(0, 0x00)
i2c.writeBuffer(0x3c, cmd)
```

## readNumber

Read a single number from a device at a 7-bit address.

```sig
i2c.readNumber(0)
```

### Parameters

* **address**: the 7-bit device address.
* **format**: optional [NumberFormat](/types/numberformat) describing the bytes to read (default ``UInt8LE``).

### Returns

* a [number](/types/number) decoded from the bytes that were read.

### Example

```blocks
i2c.init(DigitalPin.P4, DigitalPin.P5)
let value = i2c.readNumber(0x3c, NumberFormat.UInt16LE)
```

## writeNumber

Write a single number to a device at a 7-bit address.

```sig
i2c.writeNumber(0, 0)
```

### Parameters

* **address**: the 7-bit device address.
* **value**: the number to write.
* **format**: optional [NumberFormat](/types/numberformat) describing how to encode the value (default ``UInt8LE``).
* **repeated**: optional; if ``true``, send a repeated start instead of a stop after the write.

### Example

```blocks
i2c.init(DigitalPin.P4, DigitalPin.P5)
i2c.writeNumber(0x3c, 0x80, NumberFormat.UInt8LE)
```

## readRegister

Write a register index to a device, then read a number of bytes back. This is the
common pattern for reading a register from a sensor.

```sig
i2c.readRegister(0, 0, 0)
```

### Parameters

* **address**: the 7-bit device address.
* **reg**: the register index to read from.
* **size**: the number of bytes to read.

### Returns

* a [Buffer](/types/buffer) containing the bytes that were read.

### Example

```blocks
i2c.init(DigitalPin.P4, DigitalPin.P5)
let reg = i2c.readRegister(0x3c, 0x00, 2)
```

## Example

Read 2 bytes from register ``0x00`` of a sensor at address ``0x3c``.

```blocks
i2c.init(DigitalPin.P4, DigitalPin.P5)
i2c.setFrequency(400000)
let bytes = i2c.readRegister(0x3c, 0x00, 2)
let reading = bytes.getNumber(NumberFormat.UInt16LE, 0)
```
