# Sync Manifest

This file records the source snapshot used to build this portfolio monorepo.

| Area | Source repository | Source basis | Verification status |
|---|---|---|---|
| Frontend | `QS_front` | Latest frontend deployment package available in this workspace | Needs final owner-side diff before push |
| Backend | `QS_render` | Latest backend deployment package available in this workspace | Needs final owner-side diff before push |
| Original monorepo | `QuantScreen` | Uploaded `QuantScreen-main.zip` | Used as historical base/reference |

## Why this exists

`QuantScreen` is the single portfolio entry point. The live deployment pipeline remains connected to the split repositories to avoid destabilizing the already-working Vercel and Render deployments.

To prevent the portfolio monorepo from becoming a stale copy, update this file whenever `frontend/` or `backend/` is synced from the deployment repositories.

## Final check before pushing

If local clones of the deployment repositories are available next to this repository, run:

```bash
./scripts/sync_from_split_repos.sh
./scripts/verify_no_sensitive_files.sh
git status --short
```

Or manually compare:

```bash
diff -qr ../QS_front frontend \
  -x .git -x node_modules -x .next -x .vercel -x .env -x '.env.*'

diff -qr ../QS_render backend \
  -x .git -x __pycache__ -x .venv -x venv -x .env -x '*.db' -x '*.sqlite*'
```

If differences are intentional, document them in the commit message or in `docs/CODE_SYNC_POLICY.md`.
