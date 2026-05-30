/**
 * Generation of music tones on a buzzer/speaker pin.
 */
//% weight=98 color="#D83B01" icon=""
//% groups='["Tone", "Pin"]'
namespace music {
    let _pin: DigitalPin = -1;

    function ensure(): DigitalPin {
        if (_pin < 0) {
            _pin = DigitalPin.P0;
        }
        return _pin;
    }

    /**
     * Set the output pin used for tone generation.
     * @param pin the pin to play tones on, eg: DigitalPin.P0
     */
    //% blockId=music_set_pin block="set tone pin %pin"
    //% weight=50 group="Pin"
    export function setPin(pin: DigitalPin): void {
        // stop any tone playing on the previous pin
        if (_pin >= 0 && _pin != pin) {
            tonePin(_pin, 0);
        }
        _pin = pin;
    }

    /**
     * Play a tone for the given duration, then stop.
     * @param frequency frequency of the tone in Hz, eg: Note.C4
     * @param ms duration of the tone in milliseconds, eg: 500
     */
    //% blockId=music_play_tone block="play tone %frequency=device_note|for %ms ms"
    //% frequency.shadow=device_note
    //% weight=90 group="Tone"
    export function playTone(frequency: number, ms: number): void {
        const pin = ensure();
        tonePin(pin, frequency);
        if (ms > 0) {
            basic.pause(ms);
            tonePin(pin, 0);
        }
    }

    /**
     * Start playing a tone and do not stop it.
     * @param frequency frequency of the tone in Hz, eg: Note.C4
     */
    //% blockId=music_ring_tone block="ring tone (Hz) %frequency=device_note"
    //% frequency.shadow=device_note
    //% weight=80 group="Tone"
    export function ringTone(frequency: number): void {
        const pin = ensure();
        tonePin(pin, frequency);
    }

    /**
     * Rest (stop the tone) for the given duration.
     * @param ms duration of the rest in milliseconds, eg: 500
     */
    //% blockId=music_rest block="rest(ms) %ms"
    //% weight=79 group="Tone"
    export function rest(ms: number): void {
        const pin = ensure();
        tonePin(pin, 0);
        if (ms > 0) {
            basic.pause(ms);
        }
    }
}

/**
 * Well known note frequencies (Hz).
 */
//% blockId=device_note block="%note"
//% shim=TD_ID
//% note.fieldEditor="note"
//% weight=10 blockGap=8
//% useEnumVal=1
declare const enum Note {
    //% block=C3
    C3 = 131,
    //% block=D3
    D3 = 147,
    //% block=E3
    E3 = 165,
    //% block=F3
    F3 = 175,
    //% block=G3
    G3 = 196,
    //% block=A3
    A3 = 220,
    //% block=B3
    B3 = 247,
    //% block=C4
    C4 = 262,
    //% block=D4
    D4 = 294,
    //% block=E4
    E4 = 330,
    //% block=F4
    F4 = 349,
    //% block=G4
    G4 = 392,
    //% block=A4
    A4 = 440,
    //% block=B4
    B4 = 494,
    //% block=C5
    C5 = 523,
}

declare namespace music {
    /**
     * Play (or stop) a square-wave tone on a pin.
     * @param pin output pin
     * @param frequency frequency in Hz; 0 turns the tone off
     */
    //% shim=music::tonePin
    function tonePin(pin: DigitalPin, frequency: int32): void;
}
