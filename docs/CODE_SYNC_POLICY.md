# Code Sync Policy

## Purpose

This repository is the portfolio-facing monorepo for QuantScreen. It is designed as a single review entry point for evaluators, while the production deployment remains connected to the already-stable split repositories.

## Source of truth

| Area | Runtime deployment repository | Portfolio location |
|---|---|---|
| Frontend | `QS_front` | `frontend/` |
| Backend | `QS_render` | `backend/` |
| Architecture and docs | `QuantScreen` | `docs/`, root `README.md` |

## Operating rule

The monorepo should contain the same application source as the deployment repositories at the latest sync point. It is not intended to be a separate fork with different behavior.

When a deployment repository changes:

1. Sync the changed source into `frontend/` or `backend/`.
2. Run `./scripts/verify_no_sensitive_files.sh`.
3. Update `SYNC_MANIFEST.md` with the source commit or sync note.
4. Commit the monorepo update with a clear message.

## Why deployment remains split for now

The Vercel frontend and Render backend deployments were already validated independently. Changing CI/CD root directories immediately before portfolio submission would add unnecessary deployment risk.

This is therefore an intentional two-layer strategy:

- **Code review layer:** `QuantScreen` monorepo for a single evaluator entry point.
- **Runtime layer:** `QS_front` and `QS_render` for stable, independent deployment pipelines.

## Future migration path

When there is no submission deadline pressure, the deployment pipelines can be moved into this monorepo by setting:

- Vercel Root Directory: `frontend/`
- Render Blueprint Path or Root Directory: `backend/render.yaml` or `backend/`

Before switching production deployment to this monorepo, pass the smoke tests in `docs/QA_CHECKLIST.md`.
