#!/usr/bin/env bash
# ChalkPicks cloud-computer setup — run ONCE on the Manus cloud computer.
# Installs Ollama, pulls the recommended models, and schedules the daily
# content-factory worker. Safe to re-run (idempotent).
set -euo pipefail

echo "── ChalkPicks cloud-computer setup ─────────────────────────────"

# 1. Ollama (local LLM server)
if ! command -v ollama >/dev/null 2>&1; then
  echo "Installing Ollama..."
  curl -fsSL https://ollama.com/install.sh | sh
else
  echo "Ollama already installed: $(ollama --version)"
fi

# Make Ollama listen on all interfaces so chalkpicks.live's server can call it
# (the site's OLLAMA_API_URL points at this box). Skip if already configured.
if [ -d /etc/systemd/system ] && ! grep -rqs "OLLAMA_HOST" /etc/systemd/system/ollama.service.d 2>/dev/null; then
  echo "Configuring Ollama to listen on 0.0.0.0:11434..."
  sudo mkdir -p /etc/systemd/system/ollama.service.d
  printf '[Service]\nEnvironment="OLLAMA_HOST=0.0.0.0:11434"\n' | sudo tee /etc/systemd/system/ollama.service.d/host.conf >/dev/null
  sudo systemctl daemon-reload && sudo systemctl restart ollama
fi

# 2. Models — see README.md ("Which LLM?") for the reasoning.
echo "Pulling models (this downloads a few GB the first time)..."
ollama pull qwen3:8b        # primary: best quality/instruction-following per GB
ollama pull llama3.2:3b     # fallback: lighter + faster when the box is busy

# 3. Node 18+ for the worker (zero npm dependencies)
if ! command -v node >/dev/null 2>&1 || [ "$(node -e 'console.log(process.versions.node.split(".")[0])')" -lt 18 ]; then
  echo "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "Node already installed: $(node --version)"
fi

# 4. Worker env file (fill in the token!)
WORKER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ ! -f "$WORKER_DIR/.env" ]; then
  cat > "$WORKER_DIR/.env" <<'EOF'
# Shared secret — must equal WORKER_API_TOKEN on the chalkpicks.live server.
# Generate one with:  openssl rand -hex 32
WORKER_API_TOKEN=
CHALKPICKS_URL=https://chalkpicks.live
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:8b
MAX_ARTICLES=5
EOF
  echo ">>> Created $WORKER_DIR/.env — EDIT IT and set WORKER_API_TOKEN. <<<"
fi

# 5. Daily cron at 13:00 UTC (after the site's daily picks generate).
CRON_LINE="0 13 * * * cd $WORKER_DIR && set -a && . ./.env && set +a && /usr/bin/node worker.mjs >> worker.log 2>&1"
( crontab -l 2>/dev/null | grep -v "chalkpicks-worker" ; echo "$CRON_LINE # chalkpicks-worker" ) | crontab -
echo "Cron installed: daily at 13:00 UTC."

echo "── Setup complete. Test with: ──────────────────────────────────"
echo "  cd $WORKER_DIR && set -a && . ./.env && set +a && node worker.mjs"
