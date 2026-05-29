<#
.SYNOPSIS
  Build and run a PXT VM program fully inside Docker (no host toolchain needed).

.DESCRIPTION
  Builds the docker/Dockerfile image once, then bind-mounts the makecode workspace
  (the parent folder that holds both `pxt` and `pxt-bitsflow`) at /work and runs
  the build + VM inside Linux. Emits binary.pxt64 and executes it with pxt-vm-cli.

.PARAMETER Project
  Project dir relative to pxt-bitsflow. Default: projects/vmtest

.PARAMETER Seconds
  How long to run the VM before stopping (forever-loops never exit). 0 = run until
  it exits / you press Ctrl-C. Default: 3

.PARAMETER Rebuild
  Force a rebuild of the Docker image.

.EXAMPLE
  ./tools/docker-vm.ps1
  ./tools/docker-vm.ps1 -Project projects/vmtest -Seconds 5
#>
param(
    [string]$Project = "projects/vmtest",
    [int]$Seconds = 3,
    [switch]$Rebuild
)
$ErrorActionPreference = "Stop"

$here      = Split-Path -Parent $MyInvocation.MyCommand.Path   # ...\pxt-bitsflow\tools
$target    = Split-Path -Parent $here                          # ...\pxt-bitsflow
$workspace = Split-Path -Parent $target                        # ...\makecode  (holds pxt + pxt-bitsflow)
$image     = "pxt-bitsflow-vm"

if ($Rebuild -or -not (docker images -q $image)) {
    Write-Host "==> building image $image" -ForegroundColor Cyan
    docker build -t $image "$target\docker"
    if ($LASTEXITCODE -ne 0) { throw "docker build failed" }
}

Write-Host "==> running ($Project, ${Seconds}s) — workspace: $workspace" -ForegroundColor Cyan
# Allocate a TTY (nice Ctrl-C) only in a real interactive terminal.
$tty = if ([Environment]::UserInteractive -and -not [Console]::IsInputRedirected) { "-it" } else { "-i" }
$dockerArgs = @("run", "--rm", $tty, "-e", "RUN_SECONDS=$Seconds", "-v", "${workspace}:/work", $image, $Project)
docker @dockerArgs
