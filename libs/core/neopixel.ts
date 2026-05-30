/**
 * Well known colors for a NeoPixel strip
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
 * Drive WS2812 / NeoPixel addressable RGB LED strips.
 */
//% color="#00B295" weight=98 icon="" block="NeoPixel"
namespace neopixel {

    /**
     * A NeoPixel (WS2812) strip on a single GPIO pin.
     */
    export class Strip {
        _pin: DigitalPin;
        _length: number;
        _brightness: number;
        _buf: Buffer; // GRB bytes, 3 per pixel, already brightness-scaled

        /**
         * Set the color of a single pixel (0-based). Call show() to update the strip.
         */
        //% blockId=np_set_pixel block="%strip|set pixel color at %index|to %rgb=neopixel_colors"
        //% strip.defl=strip index.defl=0 weight=80
        setPixelColor(index: number, rgb: number): void {
            if (index < 0 || index >= this._length) return;
            const br = this._brightness;
            let r = (rgb >> 16) & 0xff;
            let g = (rgb >> 8) & 0xff;
            let b = rgb & 0xff;
            if (br < 255) {
                r = (r * br) >> 8;
                g = (g * br) >> 8;
                b = (b * br) >> 8;
            }
            const o = index * 3;
            this._buf[o] = g; // WS2812 wants GRB order
            this._buf[o + 1] = r;
            this._buf[o + 2] = b;
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
         * Send the current pixel colors to the strip.
         */
        //% blockId=np_show block="%strip|show" strip.defl=strip weight=79
        show(): void {
            neopixel.sendBuffer(this._pin, this._buf);
        }

        /**
         * Turn all pixels off (call show() to apply).
         */
        //% blockId=np_clear block="%strip|clear" strip.defl=strip weight=76
        clear(): void {
            this._buf.fill(0);
        }

        /**
         * Set the strip brightness (0-255). Applies to subsequent setPixelColor calls.
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

    /**
     * Create a NeoPixel strip on a pin.
     * @param pin the GPIO pin the strip's data line is connected to
     * @param numleds number of LEDs on the strip, eg: 8
     */
    //% blockId=neopixel_create block="NeoPixel at pin %pin|with %numleds|leds"
    //% blockSetVariable=strip numleds.defl=8 weight=100
    export function create(pin: DigitalPin, numleds: number): Strip {
        const strip = new Strip();
        strip._pin = pin;
        strip._length = numleds;
        strip._brightness = 64;
        strip._buf = control.createBuffer(numleds * 3);
        return strip;
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
}
