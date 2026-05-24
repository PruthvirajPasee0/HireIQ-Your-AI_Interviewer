# Attendee — self-hosted

Runs Attendee's Django stack locally. License is Elastic 2.0 (free for internal
use, no reselling as a competing managed service — fine for you running it
in-house).

## Setup (one-time)

From the repo root:

```powershell
cd infra
.\setup-attendee.ps1
```

That script:
1. Clones `attendee-labs/attendee` into `infra/attendee/upstream` if not already there.
2. Generates `upstream/.env` via Attendee's `init_env.py`.
3. Builds the Docker image (~5–10 min first run).
4. Brings up Postgres + Redis + Attendee web on port **8000**.
5. Runs the database migrations.

## Post-install (you do these manually in the browser, one time)

1. Open http://localhost:8000 and click **Sign up**.
2. The confirmation link is printed in the Docker logs — copy/paste it into your browser to verify the account.
3. Sign in.
4. Sidebar → **Settings** → **Credentials**:
   - Add a **Deepgram** credential. Paste your Deepgram API key (same one you have in `.env.local`).
   - (Optional) Add a **Zoom OAuth** credential if you want Zoom support later.
5. Sidebar → **API Keys** → **Create** → copy the key.
6. Edit `worker/.env`:
   ```
   ATTENDEE_BASE_URL=http://localhost:8000
   ATTENDEE_API_KEY=<the key from step 5>
   ```
7. Restart the worker.

That's it. The recruiter "Bot provider" dropdown set to **Attendee** will now
route through your local instance.

## Common commands

```powershell
# View logs
cd infra\attendee\upstream
docker compose -f dev.docker-compose.yaml logs -f

# Stop
docker compose -f dev.docker-compose.yaml down

# Start again (no rebuild)
docker compose -f dev.docker-compose.yaml up -d

# Rebuild after upstream update
git -C infra\attendee\upstream pull
cd infra\attendee\upstream
docker compose -f dev.docker-compose.yaml build
docker compose -f dev.docker-compose.yaml up -d
```

## Memory notes

- Idle: ~1.5 GB
- During an active interview: +600 MB for each meeting-bot container Attendee
  spawns (headless Chromium per session).

If Docker Desktop is starving for memory, increase the WSL limit in Docker
Desktop → Settings → Resources → WSL Integration → set Memory to 8 GB+.
