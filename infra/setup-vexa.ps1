# Wrapper — runs infra/vexa/setup-vexa.ps1
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& (Join-Path $ScriptDir "vexa\setup-vexa.ps1") @args
