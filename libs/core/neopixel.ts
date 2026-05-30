/**
 * Well known colors for an addressable LED strip
 */
const enum NeoPixelColors {
    //% block=red
    Red = 0xff0000,
    //% block=orange
    Orange = 0xffa500,
    //% block=yellow
    Yellow = 0xffff00,
    //% block=green
    Green = 0x00ff00,
    //% block=blue
    Blue = 0x0000ff,
    //% block=indigo
    Indigo = 0x4b0082,
    //% block=violet
    Violet = 0x8a2be2,
    //% block=purple
    Purple = 0xff00ff,
    //% block=white
    White = 0xffffff,
    //% block=black
    Black = 0x000000
}

/**
 * Type of addressable LED strip
 */
const enum NeoPixelMode {
    //% block="WS2812 (NeoPixel)"
    WS2812 = 0,
    //% block="APA102 (DotStar)"
    APA102 = 1
}

/**
 * Drive WS2812/NeoPixel and APA102/DotStar addressable RGB LED strips.
 */
//% color="#9575CD" weight=99 icon="" block="NeoPixel"
namespace neopixel {

    /**
     * An addressable LED strip (WS2812 on one data pin, or APA102 on data+clock).
     */
    export class Strip {
        _dataPin: DigitalPin;
        _clkPin: DigitalPin; // APA102 only
        _mode: NeoPixelMode;
        _length: number;
        _brightness: number;            // global brightness 0-255
        _colors: Buffer;                // raw RGB, 3 bytes per pixel (unscaled)
        _pixelBrightness: Buffer;       // per-pixel 0-255; null until first use (then global wins)
        _sendBuf: Buffer;               // wire-format scratch buffer

        /**
         * Set the color of a single pixel (0-based). Call show() to update the strip.
         */
        //% blockId=np_set_pixel block="%strip|set pixel color at %index|to %rgb=neopixel_colors"
        //% strip.defl=strip index.defl=0 weight=80
        setPixelColor(index: number, rgb: number): void {
            if (index < 0 || index >= this._length) return;
            const o = index * 3;
            this._colors[o] = (rgb >> 16) & 0xff;     // R
            this._colors[o + 1] = (rgb >> 8) & 0xff;  // G
            this._colors[o + 2] = rgb & 0xff;         // B
        }

        /**
         * Set the brightness (0-255) of a single pixel. Call show() to update the strip.
         */
        //% blockId=np_set_pixel_brightness block="%strip|set pixel brightness at %index|to %brightness"
        //% strip.defl=strip index.defl=0 brightness.min=0 brightness.max=255 brightness.defl=128 weight=78
        setPixelBrightness(index: number, brightness: number): void {
            if (index < 0 || index >= this._length) return;
            if (!this._pixelBrightness) {
                // lazily allocate, seeding every pixel with the current global brightness
                this._pixelBrightness = control.createBuffer(this._length);
                this._pixelBrightness.fill(this._brightness & 0xff);
            }
            this._pixelBrightness[index] = brightness & 0xff;
        }

        /**
         * Set every pixel to one color and update the strip.
         */
        //% blockId=np_show_color block="%strip|show color %rgb=neopixel_colors"
        //% strip.defl=strip weight=85
        showColor(rgb: number): void {
            for (let i = 0; i < this._length; i++) this.setPixelColor(i, rgb);
            this.show();
        }

        /**
         * Send the current pixel colors (with brightness) to the strip.
         */
        //% blockId=np_show block="%strip|show" strip.defl=strip weight=79
        show(): void {
            const n = this._length;
            // effective per-pixel brightness: per-pixel buffer if present, else global
            const pb = this._pixelBrightness;
            if (this._mode == NeoPixelMode.APA102) {
                // APA102 frame: start(4x0) + per pixel [0xE0|bri5, B, G, R] + end(0xFF...)
                const endBytes = (n + 15) >> 4; // >= n/2 clocks
                const total = 4 + n * 4 + endBytes;
                if (!this._sendBuf || this._sendBuf.length != total)
                    this._sendBuf = control.createBuffer(total);
                const sb = this._sendBuf;
                for (let i = 0; i < 4; i++) sb[i] = 0;
                for (let i = 0; i < n; i++) {
                    const br = pb ? pb[i] : this._brightness;
                    const co = i * 3;
                    const so = 4 + i * 4;
                    sb[so] = 0xe0 | (br >> 3); // 5-bit global brightness field
                    sb[so + 1] = this._colors[co + 2]; // B
                    sb[so + 2] = this._colors[co + 1]; // G
                    sb[so + 3] = this._colors[co];     // R
                }
                for (let i = 0; i < endBytes; i++) sb[4 + n * 4 + i] = 0xff;
                neopixel.sendDotStar(this._dataPin, this._clkPin, sb);
            } else {
                // WS2812: GRB bytes, RGB scaled by brightness (no hardware brightness)
                if (!this._sendBuf || this._sendBuf.length != n * 3)
                    this._sendBuf = control.createBuffer(n * 3);
                const sb = this._sendBuf;
                for (let i = 0; i < n; i++) {
                    const br = pb ? pb[i] : this._brightness;
                    const co = i * 3;
                    let r = this._colors[co];
                    let g = this._colors[co + 1];
                    let b = this._colors[co + 2];
                    if (br < 255) {
                        r = (r * br) >> 8;
                        g = (g * br) >> 8;
                        b = (b * br) >> 8;
                    }
                    const so = i * 3;
                    sb[so] = g; // WS2812 wants GRB order
                    sb[so + 1] = r;
                    sb[so + 2] = b;
                }
                neopixel.sendBuffer(this._dataPin, sb);
            }
        }

        /**
         * Turn all pixels off (call show() to apply).
         */
        //% blockId=np_clear block="%strip|clear" strip.defl=strip weight=76
        clear(): void {
            this._colors.fill(0);
        }

        /**
         * Set the global strip brightness (0-255). Per-pixel brightness, if set, overrides it.
         */
        //% blockId=np_brightness block="%strip|set brightness %brightness"
        //% strip.defl=strip brightness.min=0 brightness.max=255 brightness.defl=64 weight=75
        setBrightness(brightness: number): void {
            this._brightness = brightness & 0xff;
        }

        /**
         * Number of pixels on the strip.
         */
        //% blockId=np_length block="%strip|length" strip.defl=strip weight=60
        length(): number {
            return this._length;
        }
    }

    function mkStrip(dataPin: DigitalPin, clkPin: DigitalPin, numleds: number, mode: NeoPixelMode): Strip {
        const strip = new Strip();
        strip._dataPin = dataPin;
        strip._clkPin = clkPin;
        strip._mode = mode;
        strip._length = numleds;
        strip._brightness = 64;
        strip._colors = control.createBuffer(numleds * 3);
        strip._pixelBrightness = null;
        return strip;
    }

    /**
     * Create a WS2812 / NeoPixel strip on a single data pin.
     * @param pin the GPIO pin the strip's data line is connected to
     * @param numleds number of LEDs on the strip, eg: 8
     */
    //% blockId=neopixel_create block="NeoPixel at pin %pin|with %numleds|leds"
    //% blockSetVariable=strip numleds.defl=8 weight=100
    export function create(pin: DigitalPin, numleds: number): Strip {
        return mkStrip(pin, pin, numleds, NeoPixelMode.WS2812);
    }

    /**
     * Create an APA102 / DotStar strip on a data + clock pin pair.
     * @param dataPin the data (DI) pin
     * @param clkPin the clock (CI) pin
     * @param numleds number of LEDs on the strip, eg: 8
     */
    //% blockId=neopixel_create_apa102 block="DotStar at data %dataPin|clock %clkPin|with %numleds|leds"
    //% blockSetVariable=strip numleds.defl=8 weight=99
    export function createAPA102(dataPin: DigitalPin, clkPin: DigitalPin, numleds: number): Strip {
        return mkStrip(dataPin, clkPin, numleds, NeoPixelMode.APA102);
    }

    /**
     * Pack red, green and blue into a single color value.
     */
    //% blockId=neopixel_rgb block="red %red|green %green|blue %blue"
    //% red.min=0 red.max=255 green.min=0 green.max=255 blue.min=0 blue.max=255 weight=20
    export function rgb(red: number, green: number, blue: number): number {
        return ((red & 0xff) << 16) | ((green & 0xff) << 8) | (blue & 0xff);
    }

    /**
     * A well known color.
     */
    //% blockId=neopixel_colors block="%color" weight=19
    export function colors(color: NeoPixelColors): number {
        return color;
    }
}

declare namespace neopixel {
    /**
     * Low-level: send a GRB byte buffer to a WS2812 strip on a pin.
     */
    //% shim=neopixel::sendBuffer
    function sendBuffer(pin: DigitalPin, buf: Buffer): void;

    /**
     * Low-level: clock a raw APA102/DotStar byte stream out on data + clock pins (MSB first).
     */
    //% shim=neopixel::sendDotStar
    function sendDotStar(dataPin: DigitalPin, clkPin: DigitalPin, buf: Buffer): void;
}
