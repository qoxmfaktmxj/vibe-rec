# vibe-rec

PostgreSQL-first modernization workspace for the legacy recruitment system.

## Structure

- `apps/web`: Next.js application
- `apps/api`: Spring Boot application
- `infra/docker`: local development containers
- `infra/postgres`: database bootstrap assets
- `docs`: architecture and migration notes
- `legacy-notes`: extracted findings from the legacy system

## Current Phase

- Phase 0: foundation bootstrap
- Goal: local PostgreSQL + API + Web startup verification

## Development Admin Account

- Default account: `admin`
- Default password: `admin`
- Login API: `POST /api/v1/admin/auth/login`
- This account is upserted on API startup from `app.admin.dev-account.*`
