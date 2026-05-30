# Reference

The Bitsflow device APIs. Each runs on the RP2040 (Raspberry Pi Pico) via the PXT VM,
and logs to the console in the simulator.

## Device

```cards
led.on();
pins.digitalWritePin(DigitalPin.P0, 1);
neopixel.create(DigitalPin.P3, 8);
analog.analogReadPin(DigitalPin.P26);
pwm.analogWritePin(DigitalPin.P0, 512);
music.playTone(262, 500);
timing.micros();
```

## Communication

```cards
spi.init(DigitalPin.P18, DigitalPin.P19, DigitalPin.P16);
i2c.init(DigitalPin.P4, DigitalPin.P5);
uart.init(DigitalPin.P8, DigitalPin.P9, 9600);
oled.init(128, 64, 60);
```

## Pages

* [LED](reference/led.md) — onboard/attached LED on **GPIO 15**
* [Pins](reference/pins.md) — digital read/write, pull resistors
* [NeoPixel / DotStar](reference/neopixel.md) — WS2812 + APA102 strips
* [Analog (ADC)](reference/analog.md) — analog input on GP26–GP28
* [PWM & Servo](reference/pwm.md) — PWM duty + servo control
* [Music / Tone](reference/music.md) — square-wave tones on a pin
* [Timing](reference/timing.md) — microsecond timing + pulse measurement
* [SPI](reference/spi.md) — SPI master bus
* [I2C](reference/i2c.md) — I2C master bus
* [UART](reference/uart.md) — second serial bus
* [OLED display](reference/oled.md) — SSD1306 over I2C
* [BMP280 sensor](reference/bmp280.md) — temperature + pressure over I2C
* [MPU6050 sensor](reference/mpu6050.md) — accelerometer + gyroscope over I2C
* [Sonar (HC-SR04)](reference/sonar.md) — ultrasonic distance (pins + timing)
