# Morning notes — autonomous overnight session

Branch: **autonomous-overnight** (new, off `docker-vm-windows` @ 19b92f2).

## What I'm doing (no interaction needed)
Adding higher-level **I2C sensor drivers** that pair with the OLED display — pure
TypeScript on the existing `i2c` bus, so **no firmware change** and they run on the
already-flashed firmware. Each gets: API + simulator stub + reference doc + host-VM
smoke test + commit.

Planned, in priority order:
1. **BMP280** — temperature + pressure (very common, well-documented registers)
2. **MPU6050** — accelerometer + gyroscope
3. **HT16K33** — 4-digit 7-segment / 8x8 matrix (optional)
4. A combined **`projects/weatherstation`** example (BMP280 → OLED)

## ⚠️ Needs your decision (look at this)
- [ ] **Push the new branch?** I'm leaving everything local on `autonomous-overnight`.
      Say the word and I'll push + optionally open a PR into `docker-vm-windows`.
- [ ] **DHT11/22** (1-wire temp/humidity) — its strict bit-bang timing is risky on the
      polling-based VM scheduler; I'm **skipping** it unless you want me to attempt it.
- [ ] **On real hardware:** everything below is host-VM-verified only (correct I2C byte
      streams, panic-free) — I cannot flash a Pico. Please bench-test before relying on it.

## 🔴 IMPORTANT FINDING — intermittent host-VM GC panic (please look)
While smoke-testing the sensor drivers I hit **PANIC 49** (a GC read-only check,
`gc.cpp` `GC_CHECK(!isReadOnly(p), 49)`) on the **host VM (pxt-vm-cli, PXT64/x86-64)**.

Characteristics (investigated, ~8 runs):
- **Intermittent**, not deterministic: the *same* program (bmp280 init+temperature)
  panicked once, then ran clean 3× in a row. mpu6050 hit it too.
- **Buffer-read-heavy code triggers it.** Clean every time: `blink` (no buffers),
  a 200× `control.createBuffer` loop, and a 50× `i2c.readRegister` loop.
- So it's a **GC timing/race in the buffer path**, surfaced by sensor reads — NOT a
  logic bug in the drivers (their I2C byte traffic is correct).
- **Host-VM only matters for our smoke tests.** The RP2040 firmware uses a different GC
  (static 160KB arena + the gcBase/gcEnd read-only check I already hardened), so this
  may not reproduce on-device — but it casts doubt on host-VM "verified" claims for any
  buffer-heavy program.

- [ ] **DECIDE/INVESTIGATE:** is PANIC 49 a real VM GC bug or a host-only race? Repro:
      build any sensor project (e.g. recreate `projects/bmptest` with
      `bmp280.init(0x76); console.log(bmp280.temperature())`) and run it via
      `tools/docker-vm.ps1 -Project bmptest` a handful of times. I did NOT blind-patch
      the GC overnight — too risky without your call.

## Status log
- bmp280: driver + docs committed (8d2eef9). Builds + bundles; I2C trace correct;
  hit the intermittent PANIC 49 above (logic is sound).
- mpu6050: driver + docs committed. Same status (correct register map + I2C trace;
  shares the intermittent GC panic).
- Stopped adding more buffer-heavy sensors (HT16K33, weatherstation example) because
  they'd share the unresolved GC risk and I can't cleanly verify them. Resuming there
  is easy once the GC question is answered.
(see git log on this branch for commits)
