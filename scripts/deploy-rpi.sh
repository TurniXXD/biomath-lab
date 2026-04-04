#!/usr/bin/env bash
set -euo pipefail

STACK_DIR="${STACK_DIR:-/home/admin/biomath-lab}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.rpi.yml}"

if ! command -v docker-compose >/dev/null 2>&1; then
  echo "error: 'docker-compose' is not available on this host" >&2
  exit 1
fi

cd "${STACK_DIR}"

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "error: ${COMPOSE_FILE} not found in ${STACK_DIR}" >&2
  exit 1
fi

if [[ ! -f ".env" ]]; then
  echo "error: .env not found in ${STACK_DIR}" >&2
  exit 1
fi

docker-compose -f "${COMPOSE_FILE}" pull
docker-compose -f "${COMPOSE_FILE}" up -d
docker-compose -f "${COMPOSE_FILE}" ps
