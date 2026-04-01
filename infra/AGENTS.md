<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# infra

## Purpose

Infrastructure configuration for local development and deployment. Currently contains PostgreSQL Docker setup.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `docker/` | Docker-related configuration files |
| `postgres/` | PostgreSQL data directory and initialization scripts |

## For AI Agents

### Working In This Directory

- `postgres/data/` is a live PostgreSQL data directory — **never modify files here directly**
- `postgres/init/` contains initialization scripts that run on first container start
- Database schema is managed by Flyway migrations in `apps/api/src/main/resources/db/migration/`, not here
- Use `compose.deploy.yaml` (in project root) to manage the PostgreSQL container

<!-- MANUAL: -->
