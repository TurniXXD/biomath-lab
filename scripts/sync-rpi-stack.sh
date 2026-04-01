#!/usr/bin/env bash
set -euo pipefail

STACK_DIR="${STACK_DIR:-/home/admin/biomath-lab}"
SSH_PORT="${RPI_SSH_PORT:-22}"

if [[ -z "${RPI_HOST:-}" || -z "${RPI_USER:-}" ]]; then
  echo "error: RPI_HOST and RPI_USER must be set" >&2
  exit 1
fi

ssh -p "${SSH_PORT}" "${RPI_USER}@${RPI_HOST}" "mkdir -p '${STACK_DIR}/scripts'"
scp -P "${SSH_PORT}" docker-compose.rpi.yml "${RPI_USER}@${RPI_HOST}:${STACK_DIR}/docker-compose.rpi.yml"
scp -P "${SSH_PORT}" scripts/deploy-rpi.sh "${RPI_USER}@${RPI_HOST}:${STACK_DIR}/scripts/deploy-rpi.sh"
ssh -p "${SSH_PORT}" "${RPI_USER}@${RPI_HOST}" "chmod +x '${STACK_DIR}/scripts/deploy-rpi.sh' && cd '${STACK_DIR}' && ./scripts/deploy-rpi.sh"
