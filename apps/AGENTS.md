<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# apps

## Purpose

Contains the two application workloads: a Next.js frontend (`web`) and a Spring Boot backend (`api`). This is where all product code lives.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `web/` | Next.js 16 frontend — public site, candidate flows, admin workspace (see `web/AGENTS.md`) |
| `api/` | Spring Boot 4 API — auth, recruitment domain, Flyway migrations (see `api/AGENTS.md`) |

## For AI Agents

### Working In This Directory

- `web` and `api` are independent build targets with separate dependency management
- `web` communicates with `api` via HTTP; there is no shared code package
- Always run both services locally when testing end-to-end flows
- API is the source of truth for auth, business rules, and schema; web is the presentation layer

<!-- MANUAL: -->
