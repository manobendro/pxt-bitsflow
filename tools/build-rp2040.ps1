<#
.SYNOPSIS
  Build the RP2040 PXT VM firmware + a program's UF2s — fully in Docker.

.DESCRIPTION
  New model: the VM firmware is built ONCE (no program embedded) and the program's
  bytecode is flashed separately to a fixed flash region (0x10100000). Produces:
    - firmware.uf2  : the VM firmware (program-independent). Also bundled to
                      sim/public/firmware.uf2 for the in-editor download.
    - bytecode.uf2  : the program (PXTB header + .pxt64) at 0x10100000 — flash this to
                      update the program WITHOUT reflashing the firmware.
    - combined.uf2  : firmware.uf2 ++ bytecode.uf2 — flash this once for a fresh board.
  All under firmware/rp2040/build/.

  Flash: hold BOOTSEL, plug in the Pico, copy the chosen .uf2 to the RPI-RP2 drive.

.PARAMETER Project        Program project under projects/ (default: blink)
.PARAMETER RebuildFirmware  Rebuild firmware.uf2 even if cached
.PARAMETER Rebuild        Rebuild the Docker images
#>
param(
    [string]$Project = "blink",
    [switch]$RebuildFirmware,
    [switch]$Rebuild
)
$ErrorActionPreference = "Stop"

$here      = Split-Path -Parent $MyInvocation.MyCommand.Path
$target    = Split-Path -Parent $here
$workspace = Split-Path -Parent $target
$vmImage   = "pxt-bitsflow-vm"
$picoImage = "pxt-bitsflow-pico"
$buildDir  = "$target\firmware\rp2040\build"
$fwOut       = "$buildDir\bitsflow_vm_pico.uf2"   # cmake output
$firmwareUf2 = "$buildDir\firmware.uf2"
$bytecodeUf2 = "$buildDir\bytecode.uf2"
$combinedUf2 = "$buildDir\combined.uf2"
$bundledFw   = "$target\sim\public\firmware.uf2"

function Invoke-Native($file, [string[]]$cliArgs) {
    & $file @cliArgs
    if ($LASTEXITCODE -ne 0) { throw "$file $($cliArgs -join ' ') failed ($LASTEXITCODE)" }
}

# Bind-mount the sibling clones onto the package paths (host links them as Windows
# junctions Docker can't follow). Leaves host junctions untouched.
. "$here\pico-mounts.ps1"
$mounts = Get-PicoMounts $workspace

# --- Docker images ---
if ($Rebuild -or -not (docker images -q $vmImage)) {
    Invoke-Native docker @("build", "-t", $vmImage, "$target\docker")
}
if ($Rebuild -or -not (docker images -q $picoImage)) {
    Invoke-Native docker @("build", "-f", "$target\docker\Dockerfile.pico", "-t", $picoImage, "$target\docker")
}

# --- 1. Firmware (built once; program-independent) ---
if ($RebuildFirmware -or -not (Test-Path $bundledFw)) {
    Write-Host "==> [firmware] building VM firmware (shim-manifest superset, no embedded program)" -ForegroundColor Cyan
    Invoke-Native docker (@("run", "--rm", "-e", "BUILD_ONLY=1") + $mounts + @($vmImage, "projects/firmware"))
    Invoke-Native docker (@("run", "--rm") + $mounts + @($picoImage, "bash", "-lc",
        "cmake --fresh -B build -S . -DPXT_PROJECT=firmware && cmake --build build -j4"))
    Copy-Item $fwOut $firmwareUf2 -Force
    New-Item -ItemType Directory -Force (Split-Path $bundledFw) | Out-Null
    Copy-Item $fwOut $bundledFw -Force
    Write-Host "    -> $firmwareUf2  (bundled: sim/public/firmware.uf2)" -ForegroundColor Green
} else {
    Write-Host "==> [firmware] using cached firmware.uf2 (pass -RebuildFirmware to rebuild)" -ForegroundColor DarkGray
}

# --- 2. Program bytecode -> bytecode.uf2 (at 0x10100000) ---
Write-Host "==> [program] compiling '$Project' and wrapping bytecode" -ForegroundColor Cyan
Invoke-Native docker (@("run", "--rm", "-e", "BUILD_ONLY=1") + $mounts + @($vmImage, "projects/$Project"))
Invoke-Native docker (@("run", "--rm") + $mounts + @("--entrypoint", "node", $vmImage,
    "tools/gen-bytecode-uf2.js", "projects/$Project/built/binary.pxt64", "firmware/rp2040/build/bytecode.uf2"))

# --- 3. Combined = firmware ++ bytecode (UF2 blocks self-address, so a byte concat) ---
$fw = [System.IO.File]::ReadAllBytes($firmwareUf2)
$bc = [System.IO.File]::ReadAllBytes($bytecodeUf2)
[System.IO.File]::WriteAllBytes($combinedUf2, ($fw + $bc))

Write-Host ""
Write-Host "==> SUCCESS" -ForegroundColor Green
Write-Host "    firmware: $firmwareUf2"
Write-Host "    program : $bytecodeUf2"
Write-Host "    combined: $combinedUf2"
Write-Host "    Fresh board: flash combined.uf2. Update program only: flash bytecode.uf2." -ForegroundColor Green
