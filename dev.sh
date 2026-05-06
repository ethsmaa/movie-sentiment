#!/usr/bin/env bash
# CineSentiment dev launcher.
# Brings up Postgres, the FastAPI sidecar, the Hono API, and the Vite dev server
# in a single foreground process tree. Ctrl+C drops all three Node/Python
# servers; Postgres stays running in Docker (use `docker compose down` to stop).
#
# Usage:
#   ./dev.sh                  # starts everything
#   ./dev.sh --no-ml          # skip the FastAPI sidecar (Hono falls back to simulator)
#   LOG_INFERENCE=false ./dev.sh   # quiet mode for the sidecar

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

SKIP_ML=false
for arg in "$@"; do
  case "$arg" in
    --no-ml) SKIP_ML=true ;;
    *) echo "Unknown flag: $arg" >&2; exit 2 ;;
  esac
done

# 1. Make sure OrbStack/Docker is reachable
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker daemon is not reachable. Open OrbStack (or Docker Desktop) first."
  echo "   On macOS: open -a OrbStack"
  exit 1
fi

# 2. Postgres
echo "▸ Starting Postgres…"
docker compose up -d postgres > /dev/null
echo -n "  waiting for pg_isready"
until docker exec movie_sentiment_db pg_isready -U postgres > /dev/null 2>&1; do
  echo -n "."
  sleep 1
done
echo " ✓"

# 3. ML sidecar venv check (only if we plan to start it)
if [[ "$SKIP_ML" == "false" ]]; then
  if [[ ! -d "services/sentiment/.venv" ]]; then
    echo "❌ services/sentiment/.venv missing. First-time setup:"
    echo "   cd services/sentiment && python3 -m venv .venv && source .venv/bin/activate"
    echo "   pip install -r scripts/requirements-download.txt"
    echo "   python3 scripts/download_model.py"
    echo "   pip install -r requirements.txt"
    exit 1
  fi
  if [[ ! -d "services/sentiment/model" ]]; then
    echo "❌ services/sentiment/model missing. Run scripts/download_model.py first."
    exit 1
  fi
fi

LOG_INFERENCE_VALUE="${LOG_INFERENCE:-true}"

API_CMD="SENTIMENT_SERVICE_URL=http://127.0.0.1:8001 pnpm --filter @movie-sentiment/api dev"
WEB_CMD="pnpm --filter @movie-sentiment/web dev"
ML_CMD="cd services/sentiment && source .venv/bin/activate && LOG_INFERENCE=$LOG_INFERENCE_VALUE uvicorn main:app --port 8001 --log-level warning"

if [[ "$SKIP_ML" == "true" ]]; then
  exec npx concurrently \
    --names "api,web" \
    --prefix-colors "blue,green" \
    --kill-others-on-fail \
    "$API_CMD" "$WEB_CMD"
else
  exec npx concurrently \
    --names "api,web,ml " \
    --prefix-colors "blue,green,magenta" \
    --kill-others-on-fail \
    "$API_CMD" "$WEB_CMD" "$ML_CMD"
fi
