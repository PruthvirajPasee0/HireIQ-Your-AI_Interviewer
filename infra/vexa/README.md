# Vexa — self-hosted

Runs Vexa entirely on your machine. Apache-2.0, fully free with zero
license restrictions.

## Setup (one-time)

From the repo root:

```powershell
cd infra
.\setup-vexa.ps1
```

That script:
1. Clones `Vexa-ai/vexa` into `infra/vexa/upstream` if not already there.
2. Copies their `.env.example` to `.env` (you can customize after).
3. Runs `make all` to build images + bring up the CPU stack (no GPU required).
4. Waits for the API gateway on port **8056**.

> **GPU vs CPU:** the script uses the CPU profile (Whisper-tiny). If you have
> an NVIDIA GPU and want better transcription, edit `infra/vexa/upstream/.env`
> and re-run `make all-gpu` per Vexa's own docs.

## Post-install (browser steps, one time)

Vexa has two API key types:

1. **Admin token** — for creating users + minting per-user API keys. Set as
   `ADMIN_API_TOKEN` in `infra/vexa/upstream/.env` (the setup script puts
   a default; change to a long random string in production).
2. **User API key** — what the worker uses. Mint it like this:

```powershell
# Create a user (one-time)
curl -X POST http://localhost:8056/admin/users `
  -H "X-Admin-API-Key: $env:VEXA_ADMIN_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"email":"local@hireiq.ai","name":"Local"}'

# Mint an API key for that user
curl -X POST http://localhost:8056/admin/users/<userId>/tokens `
  -H "X-Admin-API-Key: $env:VEXA_ADMIN_TOKEN"
# Copy the returned token.
```

Then update `worker/.env`:

```
VEXA_BASE_URL=http://localhost:8056
VEXA_API_KEY=<that user token, starts with vxa_>
```

Restart the worker. Now picking "Vexa" in the schedule form drives bots
through your local instance.

## Common commands

```powershell
# Logs
cd infra\vexa\upstream
docker compose logs -f

# Stop
docker compose down

# Start again (no rebuild)
docker compose up -d

# Wipe data (DB + Redis volumes)
docker compose down -v

# Update to latest Vexa
git -C infra\vexa\upstream pull
cd infra\vexa\upstream
make all
```

## Memory notes

Vexa's CPU profile uses Whisper-tiny which is light. Whole stack idle:
~2.5–3 GB. During an active call: +1 GB for the bot container.

If you switch to a bigger Whisper model (small/medium/large) or use GPU,
expect proportionally more memory.

## Anatomy of the local stack

- `vexa-api` — REST gateway on port 8056 (what the worker talks to)
- `bot-manager` — spawns / despawns Chromium bot containers per meeting
- `transcription-collector` — fans audio frames from bots to Whisper
- `whisperlive` — Whisper inference (CPU or GPU)
- `tts-service` — server-side TTS (we don't use this, we send pre-synth'd
  MP3 from Deepgram/Cartesia via the `/speak` endpoint with `audio_base64`)
- `postgres` + `redis` — state
- `traefik` — optional reverse proxy (you can ignore it locally)
