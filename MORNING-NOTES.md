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

## Status log
(updated as I go — see git log on this branch for commits)
