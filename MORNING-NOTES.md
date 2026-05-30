# Morning notes — autonomous overnight session

Branch: **autonomous-overnight** (new, off `docker-vm-windows` @ 19b92f2).

## What I did (no interaction was needed)
Added higher-level **sensor drivers** — pure TypeScript on the existing `i2c` / `pins` /
`timing` APIs, so **no firmware change**; they run on the firmware already flashed. Each
got: TS API + reference doc + TOC entry + host-VM smoke test + commit.

| Commit  | Driver | What | Host-VM check |
|---------|--------|------|---------------|
| 06a208a | **BMP280** | temperature + pressure (I2C) | builds + correct I2C trace, panic-free |
| 14742e3 | **MPU6050** | accelerometer + gyroscope (I2C) | builds + correct I2C trace, panic-free |
| (this commit) | **HC-SR04 sonar** | ultrasonic distance (pins + timing.pulseIn) | builds + panic-free |

`pxt buildtarget` is green and all three bundle into `target.json`.

## ⚠️ Decisions for you (morning)
- [ ] **Push `autonomous-overnight`?** Everything is committed locally only. Say the word
      and I'll push it (and/or open a PR into `docker-vm-windows`).
- [ ] **Resume more drivers?** Deliberately deferred so they wouldn't pile up unverified:
      **HT16K33** (7-seg/matrix), a **BMP280→OLED weather-station** demo project,
      **SSD1306 bigger fonts/graphics**. All straightforward; just say go.
- [ ] **DHT11/22** (1-wire temp+humidity) — **skipped on purpose**: its sub-microsecond
      bit-bang timing is unreliable on the polling-based VM scheduler. Tell me if you
      still want an attempt.

## One thing I want to flag honestly (NOT a blocker)
During testing I saw **PANIC 49** (a GC read-only check) **once**, on the host VM, on a
buffer-heavy sensor program. I then re-ran it deliberately to pin it down:
- bmp280 (init+read) ×4 → **all clean**; mpu6050 re-run → clean; a 200× `createBuffer`
  loop, a 50× `i2c.readRegister` loop, and `blink` → **all clean**.
- **I could not reproduce it.** So it's a single, non-deterministic transient — possibly
  a host-VM (x86-64/PXT64) GC race, possibly noise. **Low confidence it's a real bug.**
- It is **host-VM only** (our smoke-test harness). The RP2040 firmware uses a different
  GC (static 160 KB arena + the gcBase/gcEnd read-only check already hardened for the
  PANIC 905 fix), so it may not apply on-device at all.
- I did **not** patch the GC — there was nothing reproducible to fix, and blind-patching
  the runtime overnight would be reckless. If you ever see it on hardware, this note is
  the starting point: `gc.cpp` `GC_CHECK(!isReadOnly(p), 49)`.

## Caveats (true for everything this session, as all prior sessions)
- **Host-VM + static verification only** — I cannot flash a Pico. The drivers emit the
  correct I2C/GPIO byte streams and run panic-free in the VM, but please **bench-test on
  real hardware** before relying on them. Likely first issues on real parts: I2C address
  (BMP280 0x76 vs 0x77; MPU6050 0x68 vs 0x69) and HC-SR04 5V echo needing a divider.
- These are in `pxt-bitsflow` only; no `pxt-common-packages` change this session.

(Authoritative record is `git log` on this branch — the table hashes are real; ignore any
hashes in earlier draft text.)
