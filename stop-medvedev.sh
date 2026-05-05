#!/usr/bin/env bash
# Stop processes listening on ports 8000 (backend) and 3000 (Next.js dev).
set -uo pipefail

stop_port() {
  local port=$1
  local os
  os="$(uname -s 2>/dev/null || echo unknown)"

  case "$os" in
    MINGW*|MSYS*|CYGWIN*)
      # Windows netstat: TCP ... LocalAddr:PORT ... LISTENING PID
      netstat -ano 2>/dev/null | awk -v port="$port" \
        '$1=="TCP" && $4=="LISTENING" && $2 ~ (":" port "$") {print $5}' | sort -u | while read -r pid; do
        [[ "$pid" =~ ^[0-9]+$ ]] || continue
        taskkill //F //PID "$pid" 2>/dev/null && echo "Stopped PID $pid (port $port)" || true
      done
      ;;
    *)
      if command -v lsof >/dev/null 2>&1; then
        pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
        if [[ -n "$pids" ]]; then
          echo "$pids" | xargs kill -9 2>/dev/null || true
          echo "Stopped listener on port $port"
        fi
      elif command -v fuser >/dev/null 2>&1; then
        fuser -k "${port}/tcp" 2>/dev/null && echo "Stopped listener on port $port" || true
      else
        echo "Install lsof or fuser, or on Windows use Git Bash (netstat/taskkill path is used)."
        return 1
      fi
      ;;
  esac
}

stop_port 8000
stop_port 3000
echo "Done."
