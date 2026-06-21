# Self-hosting Attendee + Vexa locally

This folder lets you run **both bot providers entirely on your own machine** so
you pay $0 to Attendee Cloud or Vexa Cloud forever. Same code path as cloud —
just different base URLs in `worker/.env`.

## Prerequisites (one-time)

1. **Install Docker Desktop for Windows** — https://www.docker.com/products/docker-desktop/
   - Enable WSL 2 backend (the installer walks you through it).
   - Reboot if prompted.
   - Open Docker Desktop once after install so the daemon starts.
2. **Install Git for Windows** if you don't have it: https://git-scm.com/download/win
3. Open PowerShell, then verify:
   ```powershell
   docker --version
   docker compose version
   git --version
   ```

## What you're about to run

| Provider | Image stack | RAM | Local port |
|---|---|---|---|
| Attendee | Django + Postgres + Redis (1 Docker network) | ~1.5 GB | http://localhost:8000 |
| Vexa | API gateway + bot-manager + transcription + Whisper + Postgres + Redis | ~3 GB | http://localhost:8056 |

Both can run side by side. Each meeting interview also briefly spawns a bot
container with a headless Chromium (~600 MB) while it's in the Meet.

## Bring them up

From this directory (`infra/`) in PowerShell:

```powershell
# Set up Attendee (clones repo, builds, brings up containers)
.\setup-attendee.ps1

# Set up Vexa (same idea)
.\setup-vexa.ps1
```

Each script clones the upstream repo into `infra/attendee/upstream` or
`infra/vexa/upstream`, builds the images (first run takes 5-10 min), and starts
the stack.

After each, follow the post-install steps in:
- [`attendee/README.md`](./attendee/README.md) — make an account, get an API key, add your Deepgram key inside the Attendee UI
- [`vexa/README.md`](./vexa/README.md) — get the admin token, mint a user API key

Then update `worker/.env`:

```bash
# Runtime ownership (prevents duplicate runners if functions are deployed)
LIVE_INTERVIEW_RUNTIME=worker

# Switch Attendee to self-hosted
ATTENDEE_BASE_URL=http://localhost:8000
ATTENDEE_API_KEY=<the key you generated in the local Attendee UI>

# Switch Vexa to self-hosted
VEXA_BASE_URL=http://localhost:8056
VEXA_API_KEY=<the key you minted from local Vexa>
```

Restart the worker (`Ctrl+C` then `npm run dev` in `worker/`). The provider
dropdown on the schedule form now drives bots through your own machine.

## Stopping / starting / cleanup

```powershell
# Stop Attendee but keep data
cd infra\attendee\upstream
docker compose -f dev.docker-compose.yaml down

# Stop Vexa but keep data
cd infra\vexa\upstream
docker compose down

# Wipe Attendee data (DB + Redis volumes)
cd infra\attendee\upstream
docker compose -f dev.docker-compose.yaml down -v

# Wipe Vexa data
cd infra\vexa\upstream
docker compose down -v
```

## Going back to cloud later

Just point the env vars back at the cloud URLs:

```bash
ATTENDEE_BASE_URL=https://app.attendee.dev
VEXA_BASE_URL=https://api.cloud.vexa.ai
```

(and restore the cloud API keys you got from their dashboards).

## Costs after self-host

| What | Cost |
|---|---|
| Attendee | $0 (Elastic 2.0 — free for internal use) |
| Vexa | $0 (Apache 2.0) |
| Your local machine running Docker | electricity |
| Deepgram STT inside Attendee | uses your Deepgram credit (free tier covers a lot) |
| Deepgram/Cartesia TTS in worker | same Deepgram credit |
| Gemini reasoning | free tier covers dev |

If you move this to a VPS later, budget ~$10–20/mo for a machine that can run
all three stacks (Next.js + worker + Attendee + Vexa) comfortably.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `docker: command not found` | Docker Desktop not running. Open it. |
| First build takes forever | Normal — 5-10 min first time. Subsequent rebuilds are cached. |
| Port 8000 / 8056 already in use | Stop the other service or edit the upstream compose's `ports:` mapping. |
| Bot joins but never speaks | Make sure you added Deepgram credentials inside the **local** Attendee UI (Settings → Credentials), same as you do for cloud. |
| Worker still calling cloud URLs | You didn't restart the worker after editing `.env`. `tsx watch` reloads code, not env. |
