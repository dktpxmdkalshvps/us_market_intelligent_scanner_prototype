#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONT_SRC="${QS_FRONT_PATH:-../QS_front}"
BACK_SRC="${QS_RENDER_PATH:-../QS_render}"

EXCLUDES=(
  --exclude .git
  --exclude .env
  --exclude '.env.*'
  --exclude node_modules
  --exclude .next
  --exclude .vercel
  --exclude __pycache__
  --exclude .venv
  --exclude venv
  --exclude '*.pyc'
  --exclude '*.db'
  --exclude '*.sqlite'
  --exclude '*.sqlite3'
)

mkdir -p "$ROOT_DIR/frontend" "$ROOT_DIR/backend"

if [ ! -d "$FRONT_SRC" ]; then
  echo "[fail] frontend source not found: $FRONT_SRC" >&2
  echo "Set QS_FRONT_PATH=/path/to/QS_front if needed." >&2
  exit 1
fi

if [ ! -d "$BACK_SRC" ]; then
  echo "[fail] backend source not found: $BACK_SRC" >&2
  echo "Set QS_RENDER_PATH=/path/to/QS_render if needed." >&2
  exit 1
fi

echo "[sync] $FRONT_SRC -> frontend/"
rsync -a --delete "${EXCLUDES[@]}" "$FRONT_SRC/" "$ROOT_DIR/frontend/"

echo "[sync] $BACK_SRC -> backend/"
rsync -a --delete "${EXCLUDES[@]}" "$BACK_SRC/" "$ROOT_DIR/backend/"

FRONT_COMMIT="unknown"
BACK_COMMIT="unknown"
if git -C "$FRONT_SRC" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  FRONT_COMMIT="$(git -C "$FRONT_SRC" rev-parse --short HEAD)"
fi
if git -C "$BACK_SRC" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  BACK_COMMIT="$(git -C "$BACK_SRC" rev-parse --short HEAD)"
fi

cat > "$ROOT_DIR/SYNC_MANIFEST.md" <<MANIFEST
# Sync Manifest

This file records the latest manual sync from the deployment repositories into the portfolio monorepo.

| Area | Source repository | Source path | Source commit |
|---|---|---|---|
| Frontend | QS_front | `$FRONT_SRC` | `$FRONT_COMMIT` |
| Backend | QS_render | `$BACK_SRC` | `$BACK_COMMIT` |

Synced at: `$(date -u +%Y-%m-%dT%H:%M:%SZ)`

## Verification

Run the following before pushing this monorepo:

```bash
./scripts/verify_no_sensitive_files.sh
git status --short
```
MANIFEST

echo "[ok] sync completed. Manifest updated."
