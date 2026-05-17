#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

FAILED=0

echo "[check] scanning tracked files for risky names..."
if git ls-files | grep -E '(^|/)(\.env|\.env\..+|local\.db|quantscreen\.db|.*\.(sqlite|sqlite3|db))$' | grep -v -E '(^|/)\.env\.example$'; then
  echo "[fail] tracked sensitive/runtime file detected"
  FAILED=1
fi

echo "[check] scanning for common secret tokens..."
if git grep -n -I -E '(postgresql://[^ ]+:[^ ]+@|DATABASE_URL=.*@|SECRET_KEY=.+|API_KEY=.+|PASSWORD=.+)' -- . ':!**/.env.example' ':!README.md' ':!docs/**' ':!scripts/verify_no_sensitive_files.sh'; then
  echo "[fail] possible secret detected"
  FAILED=1
fi

if [ "$FAILED" -eq 0 ]; then
  echo "[ok] no obvious sensitive files or tokens found"
else
  exit 1
fi
