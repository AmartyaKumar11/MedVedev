#!/usr/bin/env bash
# Start Medvedev V2: FastAPI backend + Next.js web (foreground; Ctrl+C stops both).
#
# PostgreSQL is NOT started here. Start the database service first; the API uses
# DATABASE_URL from backend/.env .
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo ""
echo "NOTE: This script only starts uvicorn + Next.js."
echo "      Start PostgreSQL separately (backend connects via DATABASE_URL)."
if command -v nc >/dev/null 2>&1; then
  if nc -z 127.0.0.1 5432 2>/dev/null; then
    echo "      Port 5432 is open (PostgreSQL may be up)."
  else
    echo "      Warning: nothing listening on 127.0.0.1:5432 — start Postgres before the API."
  fi
fi
echo ""

if [[ -f backend/venv/Scripts/activate ]]; then
  # shellcheck source=/dev/null
  source backend/venv/Scripts/activate
elif [[ -f backend/venv/bin/activate ]]; then
  # shellcheck source=/dev/null
  source backend/venv/bin/activate
fi

echo "Starting backend: http://127.0.0.1:8000"
(cd backend && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000) &
BACK_PID=$!

echo "Starting web:    http://127.0.0.1:3000"
(cd web && npm run dev) &
FRONT_PID=$!

cleanup() {
  echo ""
  echo "Stopping servers..."
  kill "$BACK_PID" "$FRONT_PID" 2>/dev/null || true
  wait "$BACK_PID" 2>/dev/null || true
  wait "$FRONT_PID" 2>/dev/null || true
  exit 0
}

trap cleanup INT TERM

echo "Backend PID $BACK_PID | Frontend PID $FRONT_PID — Press Ctrl+C to stop."
wait
