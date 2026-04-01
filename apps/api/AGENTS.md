<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# api

## Purpose

Spring Boot 4 REST API serving the recruitment domain. Owns authentication, application lifecycle, interview/evaluation workflows, hiring decisions, file attachments, and schema migrations. Mounted under `/api` context path.

## Key Files

| File | Description |
|------|-------------|
| `build.gradle` | Gradle build config — Spring Boot 4.0.3, Java 21, Testcontainers |
| `gradlew.bat` / `gradlew` | Gradle wrapper scripts |
| `settings.gradle` | Gradle settings |
| `.gitignore` | Git ignore rules |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `src/` | Java source and resources (see `src/AGENTS.md`) |
| `gradle/` | Gradle wrapper JAR and properties |
| `.data/` | Local file storage for application attachments (gitignored runtime data) |
| `logs/` | Application log output |

## For AI Agents

### Working In This Directory

- Java 21 with Spring Boot 4.0.3
- Schema managed by Flyway — never modify the database schema directly
- `ddl-auto: validate` — Hibernate validates entity mappings against the DB schema
- API is mounted at `/api` — all endpoints are under this prefix
- Two auth systems: admin (`X-Admin-Session`) and candidate (`X-Candidate-Session`)
- Permission-based admin authorization via `@RequiresPermission` annotation + `PermissionInterceptor`

### Testing Requirements

```powershell
.\gradlew.bat test --console=plain
```

Tests use Testcontainers with real PostgreSQL — no mocks for DB access. Test base class: `IntegrationTestBase.java`.

### Common Patterns

- **Package-by-feature**: `com.viberec.api.{domain}.{layer}` (domain/repository/service/web)
- **JPA entities**: Domain objects with `@Entity` annotations
- **Spring Data repositories**: Interface-based repository pattern
- **Record DTOs**: Java records for request/response payloads in `web` packages
- **Flyway migrations**: Versioned SQL files (`V{n}__{description}.sql`)

## Dependencies

### External

- Spring Boot 4.0.3 (Web MVC, Data JPA, Actuator, Validation, Flyway)
- PostgreSQL 16 — Database
- Flyway — Schema migrations
- Testcontainers 1.20.4 — Integration testing
- JUnit 5 — Test framework

<!-- MANUAL: -->
