# Idempotent setup for self-hosting Vexa locally (CPU profile).
# Usage:
#   .\setup-vexa.ps1
#
# Re-running is safe — skips clone if upstream/ already exists.

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$UpstreamDir = Join-Path $ScriptDir "upstream"

function Require-Cmd($cmd) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Error "Required command not found: $cmd. Install it and re-run."
        exit 1
    }
}

Require-Cmd "git"
Require-Cmd "docker"

if (-not (Test-Path $UpstreamDir)) {
    Write-Host "Cloning Vexa-ai/vexa into $UpstreamDir ..." -ForegroundColor Cyan
    git clone https://github.com/Vexa-ai/vexa.git $UpstreamDir
} else {
    Write-Host "upstream/ already present — skipping clone." -ForegroundColor Yellow
}

Push-Location $UpstreamDir
try {
    if (-not (Test-Path ".env")) {
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Host "Copied .env.example -> .env. Open it and adjust ADMIN_API_TOKEN before public deploy." -ForegroundColor Cyan
        } else {
            Write-Warning "No .env.example found in upstream — Vexa may have changed setup. Check their README."
        }
    } else {
        Write-Host ".env already exists in upstream/ — skipping copy." -ForegroundColor Yellow
    }

    # Vexa exposes a Makefile target `all` for CPU stack
    if (Get-Command make -ErrorAction SilentlyContinue) {
        Write-Host "Running 'make all' (CPU profile) — first run takes 5-15 min ..." -ForegroundColor Cyan
        make all
    } else {
        Write-Host "make not found — falling back to plain docker compose up." -ForegroundColor Yellow
        docker compose up -d --build
    }

    Write-Host "Waiting for Vexa API on http://localhost:8056 ..." -ForegroundColor Cyan
    $ok = $false
    for ($i = 0; $i -lt 60; $i++) {
        try {
            $resp = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:8056/docs" -TimeoutSec 2 -ErrorAction Stop
            if ($resp.StatusCode -lt 500) { $ok = $true; break }
        } catch {}
        Start-Sleep -Seconds 2
    }
    if (-not $ok) {
        Write-Warning "Vexa API didn't respond within 2 min. Check: docker compose logs"
    }

    # Try to extract the admin token from .env
    $envText = Get-Content ".env" -Raw
    $adminMatch = [regex]::Match($envText, '(?m)^ADMIN_API_TOKEN\s*=\s*"?([^"\r\n]+)"?')
    $adminToken = if ($adminMatch.Success) { $adminMatch.Groups[1].Value.Trim() } else { "<see infra/vexa/upstream/.env>" }

    Write-Host ""
    Write-Host "=== Vexa is up on http://localhost:8056 ===" -ForegroundColor Green
    Write-Host "Admin API token: $adminToken"
    Write-Host ""
    Write-Host "Mint a user API key (run from PowerShell):"
    Write-Host "  curl -X POST http://localhost:8056/admin/users -H 'X-Admin-API-Key: $adminToken' -H 'Content-Type: application/json' -d '{\"email\":\"local@hireiq.ai\",\"name\":\"Local\"}'"
    Write-Host "  curl -X POST http://localhost:8056/admin/users/<userId>/tokens -H 'X-Admin-API-Key: $adminToken'"
    Write-Host ""
    Write-Host "Then set in worker/.env:"
    Write-Host "  VEXA_BASE_URL=http://localhost:8056"
    Write-Host "  VEXA_API_KEY=<the user token, starts with vxa_>"
    Write-Host "Restart the worker."
} finally {
    Pop-Location
}
