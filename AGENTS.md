<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# vibe-rec (HireFlow)

## Purpose

Recruitment operations product that connects job posting discovery, profile creation, application submission, and admin review into a single flow. The product name is **HireFlow**; the repo name is `vibe-rec`.

## Key Files

| File | Description |
|------|-------------|
| `compose.deploy.yaml` | Docker Compose for postgres, api, and web services |
| `DESIGN.md` | Design system master document (colors, typography, spacing, components) |
| `TODOS.md` | Design & UX improvement backlog from plan-design-review |
| `README.md` | Project overview with local dev instructions |
| `.editorconfig` | Editor formatting rules |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `apps/` | Application code: Next.js frontend + Spring Boot API (see `apps/AGENTS.md`) |
| `docs/` | Architecture docs, auth flows, screenshots (see `docs/AGENTS.md`) |
| `infra/` | Docker and PostgreSQL infrastructure (see `infra/AGENTS.md`) |
| `scripts/` | Utility scripts (see `scripts/AGENTS.md`) |

## For AI Agents

### Operating Rules

- Verify before claiming completion. Prefer running the relevant build, lint, typecheck, or test command over guessing.
- Keep diffs small and reversible. Do not broaden scope when a local fix is enough.
- For UI work, read `DESIGN.md` first and use the tokens from `apps/web/src/app/globals.css`.
- Flyway migrations are append-only. Never edit an existing `V*.sql`; add the next migration instead.
- Do not commit runtime artifacts such as `output/`, `.omx/`, or `.omc/`.

### Architecture Overview

Two-app monorepo:
- **`apps/web`** — Next.js 16 App Router, server-rendered pages + BFF route handlers
- **`apps/api`** — Spring Boot 4, PostgreSQL, Flyway migrations

The browser talks to Next.js. Next.js either renders server components directly from the API or proxies browser-facing mutations through route handlers. Auth tokens are stored as HTTP-only cookies by Next.js and forwarded to the API via `X-Admin-Session` / `X-Candidate-Session` headers.

### Stack

- Web: Next.js 16, React, TypeScript, Tailwind CSS
- API: Spring Boot 4, Spring Data JPA, Flyway, Java 21
- DB: PostgreSQL 16
- Testing: Testcontainers (API), JUnit 5

### Working In This Directory

- Read `DESIGN.md` before creating or modifying any UI component
- Use design tokens from `globals.css`, never hardcode colors or use raw Tailwind colors
- Font family: Sora (headline + body), IBM Plex Mono (metadata). Never use Inter or system defaults
- Border radius: `rounded-lg` for containers/buttons, `rounded-full` for badges/avatars only
- Admin is desktop-only (min 1024px). Public site supports mobile to desktop

### Testing Requirements

```powershell
cd apps/api && .\gradlew.bat test --console=plain
```

API tests use Testcontainers with real PostgreSQL. No web-side test suite currently.

### Local Development

1. Start PostgreSQL: `docker compose -f compose.deploy.yaml up -d postgres`
2. Start API: `cd apps/api && .\gradlew.bat bootRun --args=--server.port=8080`
3. Start Web: `cd apps/web && npm run dev` (set `API_BASE_URL` and `NEXT_PUBLIC_API_BASE_URL` env vars)

### Demo Data

- Flyway migration: `apps/api/src/main/resources/db/migration/V25__refresh_realistic_demo_dataset.sql`
- Manual seed: `apps/api/src/main/resources/db/seed/demo-seed.sql`
- Hotspot posting: `1001 / platform-backend-engineer` with 5,000 demo applicants

## Dependencies

### External

- Next.js 16 — Frontend framework
- Spring Boot 4.0.3 — Backend framework
- PostgreSQL 16 — Database
- Flyway — Schema migrations
- Tailwind CSS — Styling
- Testcontainers 1.20.4 — Integration testing

<!-- MANUAL: -->
