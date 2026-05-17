#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

FAILED=0

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  LIST_CMD="git ls-files"
  GREP_CMD=(git grep -n -I -E)
else
  echo "[warn] not inside a git repository; using filesystem scan fallback"
  LIST_CMD="find . -type f"
  GREP_CMD=(grep -RInE)
fi

echo "[check] scanning tracked/filesystem files for risky names..."
if eval "$LIST_CMD" | grep -E '(^|/)(\.env|\.env\..+|local\.db|quantscreen\.db|.*\.(sqlite|sqlite3|db))$' | grep -v -E '(^|/)\.env\.example$'; then
  echo "[fail] sensitive/runtime file detected"
  FAILED=1
fi

echo "[check] scanning for common secret tokens..."
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if git grep -n -I -E '(postgresql://[^ ]+:[^ ]+@|DATABASE_URL=.*@|SECRET_KEY=.+|API_KEY=.+|PASSWORD=.+)' -- . ':!**/.env.example' ':!README.md' ':!docs/**' ':!scripts/verify_no_sensitive_files.sh'; then
    echo "[fail] possible secret detected"
    FAILED=1
  fi
else
  if grep -RInE '(postgresql://[^ ]+:[^ ]+@|DATABASE_URL=.*@|SECRET_KEY=.+|API_KEY=.+|PASSWORD=.+)' . \
    --exclude='*.zip' \
    --exclude='.env.example' \
    --exclude='README.md' \
    --exclude='verify_no_sensitive_files.sh' \
    --exclude-dir='.git' \
    --exclude-dir='docs' \
    --exclude-dir='node_modules' \
    --exclude-dir='__pycache__' \
    --exclude-dir='.venv'; then
    echo "[fail] possible secret detected"
    FAILED=1
  fi
fi

if [ "$FAILED" -eq 0 ]; then
  echo "[ok] no obvious sensitive files or tokens found"
else
  exit 1
fi
