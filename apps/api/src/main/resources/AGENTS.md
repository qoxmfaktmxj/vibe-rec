<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# resources

## Purpose

Application configuration, database migrations, static assets, and templates for the Spring Boot API.

## Key Files

| File | Description |
|------|-------------|
| `application.yml` | Spring Boot config — datasource, Flyway, actuator, admin dev account |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `db/migration/` | Flyway versioned SQL migrations (V1 through V25) |
| `db/seed/` | Manual seed data scripts for demo/testing |
| `static/` | Static assets served by Spring |
| `templates/` | Server-side templates (if any) |

## For AI Agents

### Working In This Directory

- **Flyway migrations are append-only** — never modify existing migration files
- New migrations must use the next version number: `V{n+1}__{description}.sql`
- Current latest migration: `V25__refresh_realistic_demo_dataset.sql`
- `application.yml` uses `${ENV_VAR:default}` syntax for environment-based config
- DB connection defaults to `localhost:5435/vibe_rec` for local development
- Dev admin account is configurable via `APP_ADMIN_DEV_ACCOUNT_*` env vars

### Key Migrations

| Migration | Description |
|-----------|-------------|
| `V1` | Platform schema init (admin accounts) |
| `V2` | Recruitment MVP (job postings, applications) |
| `V7` | Application attachments |
| `V8` | Normalized resume tables |
| `V9` | Interview and evaluation tables |
| `V10` | Final status and notification |
| `V11` | Permission tables (RBAC) |
| `V13` | Candidate auth tables |
| `V18` | Candidate profile |
| `V19` | Job posting custom questions |
| `V25` | Realistic demo dataset refresh (5,000 applicants) |

<!-- MANUAL: -->
