# Wrapper — runs infra/attendee/setup-attendee.ps1
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& (Join-Path $ScriptDir "attendee\setup-attendee.ps1") @args
