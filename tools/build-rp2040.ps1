<#
.SYNOPSIS
  Build the RP2040 PXT VM firmware (.uf2) for a MakeCode project — fully in Docker.

.DESCRIPTION
  Three stages, all containerized (host needs only Docker):
    1. Build the project to VM bytecode + pxtapp C++ (the pxt-bitsflow-vm image).
    2. Embed binary.pxt64 into firmware/rp2040/generated/vm_image.c.
    3. Compile the firmware with arm-none-eabi + pico-sdk (the pxt-bitsflow-pico image)
       -> firmware/rp2040/build/bitsflow_vm_pico.uf2.

  Flash: hold BOOTSEL while plugging in the Pico, then copy the .uf2 onto the
  RPI-RP2 drive (or use picotool).

.PARAMETER Project
  Project dir name under projects/. Default: blink

.PARAMETER Rebuild
  Force a rebuild of the Docker images.

.EXAMPLE
  ./tools/build-rp2040.ps1
  ./tools/build-rp2040.ps1 -Project blink -Rebuild
#>
param(
    [string]$Project = "blink",
    [switch]$Rebuild
)
$ErrorActionPreference = "Stop"

$here      = Split-Path -Parent $MyInvocation.MyCommand.Path
$target    = Split-Path -Parent $here
$workspace = Split-Path -Parent $target
$vmImage   = "pxt-bitsflow-vm"
$picoImage = "pxt-bitsflow-pico"

function Invoke-Native($file, [string[]]$cliArgs) {
    & $file @cliArgs
    if ($LASTEXITCODE -ne 0) { throw "$file $($cliArgs -join ' ') failed ($LASTEXITCODE)" }
}

# --- images ---
if ($Rebuild -or -not (docker images -q $vmImage)) {
    Write-Host "==> building $vmImage" -ForegroundColor Cyan
    Invoke-Native docker @("build", "-t", $vmImage, "$target\docker")
}
if ($Rebuild -or -not (docker images -q $picoImage)) {
    Write-Host "==> building $picoImage (clones pico-sdk; first run takes a few minutes)" -ForegroundColor Cyan
    Invoke-Native docker @("build", "-f", "$target\docker\Dockerfile.pico", "-t", $picoImage, "$target\docker")
}

# --- 1. compile project to bytecode + pxtapp (entrypoint fixes symlinks + patches) ---
Write-Host "==> [1/3] building project '$Project' (bytecode + pxtapp)" -ForegroundColor Cyan
Invoke-Native docker @("run", "--rm", "-e", "BUILD_ONLY=1", "-v", "${workspace}:/work",
    $vmImage, "projects/$Project")

# --- 2. embed the image ---
Write-Host "==> [2/3] embedding binary.pxt64 -> generated/vm_image.c" -ForegroundColor Cyan
Invoke-Native docker @("run", "--rm", "-v", "${workspace}:/work", "--entrypoint", "node", $vmImage,
    "/work/pxt-bitsflow/tools/gen-vm-image.js",
    "/work/pxt-bitsflow/projects/$Project/built/binary.pxt64",
    "/work/pxt-bitsflow/firmware/rp2040/generated/vm_image.c")

# --- 3. build firmware (.uf2) ---
Write-Host "==> [3/3] compiling RP2040 firmware (pico-sdk)" -ForegroundColor Cyan
$build = "cmake -G 'Unix Makefiles' -B build -S . -DPXT_PROJECT=$Project && cmake --build build -j4"
Invoke-Native docker @("run", "--rm", "-v", "${workspace}:/work", $picoImage, "bash", "-lc", $build)

$uf2 = "$target\firmware\rp2040\build\bitsflow_vm_pico.uf2"
if (Test-Path $uf2) {
    Write-Host "`n==> SUCCESS: $uf2" -ForegroundColor Green
    Write-Host "    Flash: hold BOOTSEL, plug in the Pico, copy the .uf2 to the RPI-RP2 drive." -ForegroundColor Green
} else {
    throw "firmware build finished but $uf2 was not produced"
}
