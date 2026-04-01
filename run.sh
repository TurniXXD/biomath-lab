#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cleanup() {
  if [[ ${#PIDS[@]} -gt 0 ]]; then
    kill "${PIDS[@]}" 2>/dev/null || true
    wait "${PIDS[@]}" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

PIDS=()

# Start only the database in Docker, then run the rest locally in dev mode.
docker compose -f "${ROOT_DIR}/docker-compose.dev.yml" up -d db

(
  cd "${ROOT_DIR}/server"
  exec ./run.sh
) &
PIDS+=($!)

(
  cd "${ROOT_DIR}/services/publications-news"
  exec uv run python -m app.main
) &
PIDS+=($!)

(
  cd "${ROOT_DIR}/services/alignment"
  exec cargo run --bin alignment-server
) &
PIDS+=($!)

(
  cd "${ROOT_DIR}/client"
  exec pnpm dev -- --hostname 0.0.0.0 --port 3000
) &
PIDS+=($!)

wait -n "${PIDS[@]}"
