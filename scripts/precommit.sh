#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

load_node_runtime() {
  if command -v node >/dev/null 2>&1; then
    return 0
  fi

  if [ -s "${HOME}/.nvm/nvm.sh" ]; then
    # shellcheck disable=SC1090
    . "${HOME}/.nvm/nvm.sh"
  fi

  if command -v node >/dev/null 2>&1; then
    return 0
  fi

  if [ -s "${HOME}/.asdf/asdf.sh" ]; then
    # shellcheck disable=SC1090
    . "${HOME}/.asdf/asdf.sh"
  fi

  if command -v node >/dev/null 2>&1; then
    return 0
  fi

  if command -v fnm >/dev/null 2>&1; then
    eval "$(fnm env --shell bash)"
  fi
}

run_client_lint() {
  if command -v pnpm >/dev/null 2>&1; then
    (cd "${ROOT_DIR}/client" && pnpm lint)
    return
  fi

  if command -v corepack >/dev/null 2>&1; then
    (cd "${ROOT_DIR}/client" && corepack pnpm lint)
    return
  fi

  echo "pre-commit: no Yarn or pnpm command found for client lint." >&2
  exit 1
}

run_server_tests() {
  if command -v uv >/dev/null 2>&1; then
    (cd "${ROOT_DIR}/server" && uv run --with pytest pytest -q)
    return
  fi

  if [ -x "${ROOT_DIR}/server/.venv/bin/python" ]; then
    if (cd "${ROOT_DIR}/server" && ./.venv/bin/python -c "import pytest" >/dev/null 2>&1); then
      (cd "${ROOT_DIR}/server" && ./.venv/bin/python -m pytest -q)
      return
    fi

    echo "pre-commit: pytest is not installed in server/.venv; skipping server tests." >&2
    return
  fi

  echo "pre-commit: no uv or server/.venv Python available for tests; skipping server tests." >&2
}

load_node_runtime

if ! command -v node >/dev/null 2>&1; then
  echo "pre-commit: Node runtime not found. Load nvm/asdf/fnm or reinstall Node before committing." >&2
  exit 1
fi

run_client_lint
run_server_tests
