# Analog

Read analog (ADC) values from the pins of your Raspberry Pi Pico (RP2040).

The RP2040 ADC is a 12-bit converter and is only available on pins **P26**, **P27**,
and **P28**. Reading any other pin returns ``0``. In the simulator, analog reads are
logged to the console.

## analogReadPin

Read the analog value of a pin scaled to the range ``0`` to ``1023``.

```sig
analog.analogReadPin(DigitalPin.P26)
```

### Parameters

* **pin**: the pin to read the analog value from. Use an ADC-capable pin
(``P26``, ``P27``, or ``P28``).

### Returns

* a [number](/types/number) between ``0`` and ``1023`` representing the analog
value of the pin.

```blocks
let value = analog.analogReadPin(DigitalPin.P26)
```

## analogReadRaw

Read the raw 12-bit analog value of a pin in the range ``0`` to ``4095``.

```sig
analog.analogReadRaw(DigitalPin.P26)
```

### Parameters

* **pin**: the pin to read the raw analog value from. Use an ADC-capable pin
(``P26``, ``P27``, or ``P28``).

### Returns

* a [number](/types/number) between ``0`` and ``4095`` representing the raw
12-bit ADC reading of the pin.

```blocks
let raw = analog.analogReadRaw(DigitalPin.P26)
```

## analogReadMillivolts

Read the analog value of a pin as a voltage in millivolts, using the ``3.3V``
reference.

```sig
analog.analogReadMillivolts(DigitalPin.P26)
```

### Parameters

* **pin**: the pin to read the voltage from. Use an ADC-capable pin
(``P26``, ``P27``, or ``P28``).

### Returns

* a [number](/types/number) between ``0`` and ``3300`` representing the voltage
of the pin in millivolts.

```blocks
let millivolts = analog.analogReadMillivolts(DigitalPin.P26)
```

## Example

Read the analog value on ``P26`` and use it to set the brightness of an LED
on ``P0``.

```blocks
basic.forever(function () {
    let value = analog.analogReadPin(DigitalPin.P26)
    pwm.analogWritePin(DigitalPin.P0, value)
})
```
