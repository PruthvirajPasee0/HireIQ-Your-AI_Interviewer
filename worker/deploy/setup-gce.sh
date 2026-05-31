#!/usr/bin/env bash
#
# One-shot setup for running the Hireiq.ai worker on a fresh Debian/Ubuntu
# Google Compute Engine e2-micro VM (Always Free tier).
#
# Usage (run as a normal sudo-capable user on the VM):
#   curl -fsSL <raw-url-to-this-script> | bash
# OR copy this file over and:
#   bash setup-gce.sh
#
# After it finishes, you MUST create the env file:
#   sudo nano /opt/hireiq/worker/.env       # paste your secrets (see README)
#   sudo systemctl restart hireiq-worker
#
# Idempotent — safe to re-run (e.g. to pull new code + rebuild).

set -euo pipefail

REPO_URL="https://github.com/PruthvirajPasee0/HireIQ-Your-AI_Interviewer.git"
APP_DIR="/opt/hireiq"
WORKER_DIR="$APP_DIR/worker"
NODE_MAJOR=20

echo "==> Installing prerequisites (git, curl)"
sudo apt-get update -y
sudo apt-get install -y git curl ca-certificates

if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt "$NODE_MAJOR" ]; then
  echo "==> Installing Node.js $NODE_MAJOR"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "==> Node $(node -v) already present"
fi

echo "==> Cloning / updating repo into $APP_DIR"
sudo mkdir -p "$APP_DIR"
sudo chown "$USER":"$USER" "$APP_DIR"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull --ff-only
else
  git clone "$REPO_URL" "$APP_DIR"
fi

echo "==> Installing worker deps + building"
cd "$WORKER_DIR"
npm ci
npm run build

# Preserve an existing .env across re-runs; create a template if missing.
if [ ! -f "$WORKER_DIR/.env" ]; then
  echo "==> Creating .env TEMPLATE (you must fill it in!)"
  cat > "$WORKER_DIR/.env" <<'EOF'
# === Firebase Admin (from ai-interviewer-pulse service account) ===
FIREBASE_PROJECT_ID=ai-interviewer-pulse
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@ai-interviewer-pulse.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...PASTE FULL KEY WITH \\n NEWLINES...\n-----END PRIVATE KEY-----\n"

# === Attendee.dev ===
ATTENDEE_CLOUD_BASE_URL=https://app.attendee.dev
ATTENDEE_CLOUD_API_KEY=
ATTENDEE_API_KEY=
ATTENDEE_BASE_URL=https://app.attendee.dev

# === Deepgram (agent TTS) ===
DEEPGRAM_API_KEY=
DEEPGRAM_TTS_VOICE=aura-2-odysseus-en

# === Cartesia (TTS fallback) ===
CARTESIA_API_KEY=
CARTESIA_MODEL=sonic-2
CARTESIA_VOICE_ID=694f9389-aac1-45b6-b726-9d9369183238

# === Gemini ===
GOOGLE_GENERATIVE_AI_API_KEY=
GEMINI_TEXT_MODEL=gemini-2.5-flash-lite

LOG_LEVEL=info
PORT=8000
EOF
  echo "    -> EDIT $WORKER_DIR/.env and paste your real secrets, then restart."
else
  echo "==> Existing .env kept"
fi

echo "==> Installing systemd service"
sudo cp "$WORKER_DIR/deploy/hireiq-worker.service" /etc/systemd/system/hireiq-worker.service
sudo systemctl daemon-reload
sudo systemctl enable hireiq-worker
sudo systemctl restart hireiq-worker

echo ""
echo "==================================================================="
echo " Worker installed. Status:"
sudo systemctl --no-pager status hireiq-worker || true
echo "==================================================================="
echo " Next:"
echo "   1. sudo nano $WORKER_DIR/.env     # paste real secrets if not done"
echo "   2. sudo systemctl restart hireiq-worker"
echo "   3. journalctl -u hireiq-worker -f # watch live logs"
echo "==================================================================="
