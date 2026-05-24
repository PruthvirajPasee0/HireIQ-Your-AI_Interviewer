# Idempotent setup for self-hosting Attendee locally.
# Usage (from infra/ directory):
#   .\setup-attendee.ps1
#
# Re-running it is safe — it skips clone if upstream/ already exists.

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$UpstreamDir = Join-Path $ScriptDir "upstream"
$ComposeFile = "dev.docker-compose.yaml"

function Require-Cmd($cmd) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Error "Required command not found: $cmd. Install it and re-run."
        exit 1
    }
}

Require-Cmd "git"
Require-Cmd "docker"

if (-not (Test-Path $UpstreamDir)) {
    Write-Host "Cloning attendee-labs/attendee into $UpstreamDir ..." -ForegroundColor Cyan
    git clone https://github.com/attendee-labs/attendee.git $UpstreamDir
} else {
    Write-Host "upstream/ already present — skipping clone (pull manually if you want latest)." -ForegroundColor Yellow
}

Push-Location $UpstreamDir
try {
    if (-not (Test-Path ".env")) {
        Write-Host "Generating Attendee .env via init_env.py ..." -ForegroundColor Cyan
        docker compose -f $ComposeFile run --rm attendee-app-local python init_env.py | Out-File -Encoding utf8 .env
        if (-not (Test-Path ".env") -or (Get-Item .env).Length -eq 0) {
            Write-Error ".env generation failed — check Docker is running and try again."
            exit 1
        }
    } else {
        Write-Host ".env already exists in upstream/ — skipping init_env.py." -ForegroundColor Yellow
    }

    Write-Host "Building Attendee image (5-10 min first time) ..." -ForegroundColor Cyan
    docker compose -f $ComposeFile build

    Write-Host "Starting Attendee stack (detached) ..." -ForegroundColor Cyan
    docker compose -f $ComposeFile up -d

    Write-Host "Waiting for Attendee to be reachable on http://localhost:8000 ..." -ForegroundColor Cyan
    $ok = $false
    for ($i = 0; $i -lt 60; $i++) {
        try {
            $resp = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:8000" -TimeoutSec 2 -ErrorAction Stop
            if ($resp.StatusCode -lt 500) { $ok = $true; break }
        } catch {}
        Start-Sleep -Seconds 2
    }
    if (-not $ok) {
        Write-Warning "Attendee web didn't respond within 2 min. Check: docker compose -f $ComposeFile logs"
    }

    Write-Host "Running database migrations ..." -ForegroundColor Cyan
    docker compose -f $ComposeFile exec attendee-app-local python manage.py migrate

    Write-Host ""
    Write-Host "=== Attendee is up on http://localhost:8000 ===" -ForegroundColor Green
    Write-Host "Next steps:"
    Write-Host "  1. Open http://localhost:8000 -> Sign up"
    Write-Host "  2. Confirmation link prints in: docker compose -f $ComposeFile logs attendee-app-local"
    Write-Host "  3. Sign in -> Settings -> Credentials -> add your Deepgram key"
    Write-Host "  4. Sidebar -> API Keys -> create one"
    Write-Host "  5. Set in worker/.env:"
    Write-Host "       ATTENDEE_BASE_URL=http://localhost:8000"
    Write-Host "       ATTENDEE_API_KEY=<that key>"
    Write-Host "  6. Restart worker (Ctrl+C then npm run dev)"
} finally {
    Pop-Location
}
