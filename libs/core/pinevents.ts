/**
 * Pin transition (edge) to listen for.
 */
const enum PinEvent {
    //% block="rising (0→1)"
    Rising = 1,
    //% block="falling (1→0)"
    Falling = 2,
    //% block="changed"
    Changed = 3
}

namespace pins {
    // Event-source id base for pin events. Each watched pin uses PIN_EVT_BASE + pin as its
    // event source, so handlers registered via control.onEvent fire when we raise it.
    const PIN_EVT_BASE = 0x9100;

    let _watchedPins: number[] = null; // GPIO numbers being polled
    let _lastState: number[] = null;   // last sampled level per watched pin
    let _pollerStarted = false;

    function srcOf(pin: number): number {
        return PIN_EVT_BASE + pin;
    }

    function ensurePoller(): void {
        if (_pollerStarted) return;
        _pollerStarted = true;
        // A cooperative background fiber polls the watched pins and raises events from
        // normal (non-ISR) context — no GPIO interrupt, so no malloc-in-ISR hazard.
        control.runInParallel(function () {
            while (true) {
                for (let i = 0; i < _watchedPins.length; i++) {
                    const p = _watchedPins[i];
                    const cur = pins.digitalReadPin(p);
                    if (cur != _lastState[i]) {
                        control.raiseEvent(srcOf(p), cur == 1 ? PinEvent.Rising : PinEvent.Falling);
                        control.raiseEvent(srcOf(p), PinEvent.Changed);
                        _lastState[i] = cur;
                    }
                }
                basic.pause(2); // ~500 Hz sampling; debounces contact bounce somewhat
            }
        });
    }

    /**
     * Run code when a pin's digital level changes in the given way.
     * @param pin the pin to watch
     * @param event the transition to react to
     * @param handler code to run when the event happens
     */
    //% blockId=pins_on_pin_event block="on pin %pin|%event"
    //% weight=20
    export function onPinEvent(pin: DigitalPin, event: PinEvent, handler: () => void): void {
        if (!_watchedPins) {
            _watchedPins = [];
            _lastState = [];
        }
        control.onEvent(srcOf(pin), event, handler);
        if (_watchedPins.indexOf(pin) < 0) {
            _watchedPins.push(pin);
            _lastState.push(pins.digitalReadPin(pin));
        }
        ensurePoller();
    }
}
