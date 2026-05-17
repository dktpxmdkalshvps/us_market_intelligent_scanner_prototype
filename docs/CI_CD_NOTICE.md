# CI/CD Notice

This repository contains deployment-ready frontend and backend code, but the current live production deployments are intentionally still wired to the split repositories.

## Current live deployment

| Service | Platform | Active deployment repository |
|---|---|---|
| Frontend | Vercel | `QS_front` |
| Backend | Render | `QS_render` |
| Database | Render PostgreSQL | Managed by Render |

## Meaning of deployment files inside this monorepo

Files such as `frontend/vercel.json`, `backend/render.yaml`, `backend/build.sh`, and `backend/start.sh` are not decorative. They are the same type of deployment configuration used by the split deployment repositories and can be activated from this monorepo by configuring each platform's root directory.

They are kept here so reviewers can inspect the complete deployment configuration from one repository.

## Why not switch immediately

The deployed service is already stable. Re-pointing both Vercel and Render to a new monorepo shortly before submission can introduce avoidable risk. The safer operational choice is to keep runtime deployment stable and use this monorepo as the canonical portfolio review surface.
