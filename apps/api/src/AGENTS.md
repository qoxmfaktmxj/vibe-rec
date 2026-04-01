<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# src (api)

## Purpose

Java source code and resources for the Spring Boot API, plus integration tests.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `main/` | Production source code and resources (see `main/AGENTS.md`) |
| `test/` | Integration tests using Testcontainers (see `test/AGENTS.md`) |

## For AI Agents

### Working In This Directory

- Production code is in `main/java/com/viberec/api/`
- Resources (application config, Flyway migrations) are in `main/resources/`
- All tests are integration tests running against a real PostgreSQL via Testcontainers

<!-- MANUAL: -->
