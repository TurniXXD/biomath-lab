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
  local -a files=("$@")
  local -a relative_files=()
  local file

  if [ "${#files[@]}" -eq 0 ]; then
    echo "pre-commit: no lintable client files changed; skipping client lint."
    return
  fi

  for file in "${files[@]}"; do
    relative_files+=("${file#client/}")
  done

  if command -v pnpm >/dev/null 2>&1; then
    (cd "${ROOT_DIR}/client" && pnpm lint -- "${relative_files[@]}")
    return
  fi

  if command -v corepack >/dev/null 2>&1; then
    (cd "${ROOT_DIR}/client" && corepack pnpm lint -- "${relative_files[@]}")
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

run_alignment_tests() {
  if command -v cargo >/dev/null 2>&1; then
    (cd "${ROOT_DIR}/services/alignment" && cargo test)
    return
  fi

  echo "pre-commit: cargo not found; skipping alignment tests." >&2
}

staged_files=()
while IFS= read -r file; do
  staged_files+=("$file")
done < <(git diff --cached --name-only --diff-filter=ACMR)

has_prefix() {
  local prefix="$1"
  local file

  for file in "${staged_files[@]}"; do
    case "$file" in
      "${prefix}"*)
        return 0
        ;;
    esac
  done

  return 1
}

needs_checks() {
  has_prefix "client/" || has_prefix "server/" || has_prefix "services/alignment/"
}

client_lint_files=()
for file in "${staged_files[@]}"; do
  case "$file" in
    client/*.js|client/*.jsx|client/*.ts|client/*.tsx|client/*.mjs|client/*.cjs)
      client_lint_files+=("$file")
      ;;
  esac
done

if ! needs_checks; then
  echo "pre-commit: no client, server, or alignment changes detected; skipping checks."
  exit 0
fi

if has_prefix "client/"; then
  if [ "${#client_lint_files[@]}" -eq 0 ]; then
    echo "pre-commit: client changes detected but none are lintable; skipping client lint."
  else
    load_node_runtime

    if ! command -v node >/dev/null 2>&1; then
      echo "pre-commit: Node runtime not found. Load nvm/asdf/fnm or reinstall Node before committing." >&2
      exit 1
    fi

    run_client_lint "${client_lint_files[@]}"
  fi
fi

if has_prefix "server/"; then
  run_server_tests
fi

if has_prefix "services/alignment/"; then
  run_alignment_tests
fi
