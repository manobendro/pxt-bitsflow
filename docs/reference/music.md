# Music

Play square-wave tones on a pin using the Raspberry Pi Pico (RP2040) hardware PWM.

Connect a passive buzzer or speaker between the output pin and **GND**. The output pin defaults to **P0**; change it with [setPin](/reference/music/set-pin). When running in the simulator, tones are logged to the console instead of being played.

Notes are chosen from the `Note` enum, which maps note names to their frequency in Hz (for example `Note.C4` is `262`, `Note.A4` is `440`, `Note.C5` is `523`). In Blocks a note picker is shown so you can select a note by name.

## setPin

Choose the digital pin used to output tones.

```sig
music.setPin(DigitalPin.P0)
```

### Parameters

* **pin**: the [DigitalPin](/reference) (`P0`..`P28`) to send the tone signal to. Defaults to `P0`.

```blocks
music.setPin(DigitalPin.P2)
```

## playTone

Play a tone at a given frequency for a number of milliseconds, then stop.

```sig
music.playTone(262, 500)
```

### Parameters

* **frequency**: a [number](/types/number) giving the tone frequency in Hz.
* **ms**: a [number](/types/number) giving how long to play the tone in milliseconds.

```blocks
music.playTone(Note.C4, 500)
music.playTone(Note.E4, 500)
music.playTone(Note.G4, 500)
```

## ringTone

Start a tone at a given frequency and keep it playing. The tone does not stop on its own; call another tone, [rest](/reference/music/rest), or [playTone](/reference/music/play-tone) to change or end it.

```sig
music.ringTone(440)
```

### Parameters

* **frequency**: a [number](/types/number) giving the tone frequency in Hz.

```blocks
music.ringTone(Note.A4)
```

## rest

Make no sound for a number of milliseconds.

```sig
music.rest(500)
```

### Parameters

* **ms**: a [number](/types/number) giving how long to stay silent in milliseconds.

```blocks
music.rest(1000)
```

## Example

Play a short C-major run, then switch the output to **P2** and ring a note with a rest:

```blocks
music.playTone(Note.C4, 400)
music.playTone(Note.D4, 400)
music.playTone(Note.E4, 400)
music.playTone(Note.F4, 400)
music.playTone(Note.G4, 400)

music.setPin(DigitalPin.P2)
music.ringTone(Note.A4)
music.rest(1000)
```
