<!-- Parent: ../../../../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# com.viberec.api

## Purpose

Root Java package for the HireFlow API. Organized by domain with a package-by-feature structure. Each domain package contains `domain/`, `repository/`, `service/`, and `web/` sub-packages.

## Key Files

| File | Description |
|------|-------------|
| `VibeRecApiApplication.java` | Spring Boot main class |

## Subdirectories (Domain Packages)

| Package | Purpose |
|---------|---------|
| `admin/` | Admin workspace — auth, applicant management, attachments, hiring, interviews, job postings |
| `candidate/` | Candidate-facing — auth (signup/login/session) and profile management |
| `recruitment/` | Core recruitment domain — applications, attachments, evaluations, interviews, job postings, notifications |
| `migration/` | Legacy data migration — mapping tables and migration run tracking |
| `platform/` | Platform infrastructure — permission system (roles, permissions, RBAC) |

## For AI Agents

### Working In This Directory

- **Package-by-feature**: Each domain has `domain/` (JPA entities, enums), `repository/` (Spring Data), `service/` (business logic), `web/` (controllers, DTOs)
- `admin/` contains admin-facing controllers that delegate to `recruitment/` domain entities
- `recruitment/` owns the core domain model (job postings, applications, interviews, evaluations)
- `candidate/` owns candidate auth and profile; candidate write actions route through `recruitment/`
- `platform/permission/` provides `@RequiresPermission` annotation + `PermissionInterceptor` for admin RBAC

### Domain Model Summary

**Admin Auth:** `AdminAccount` → `AdminSession`, RBAC via `Permission` + `RolePermission`
**Candidate Auth:** `CandidateAccount` → `CandidateSession`, `CandidateProfile`
**Recruitment:**
- `JobPosting` → `JobPostingStep` (recruitment stages)
- `Application` → `ApplicationResumeRaw`, normalized resume tables (education, experience, skills, certifications, languages)
- `ApplicationAttachment` (file uploads)
- `Interview` → `Evaluation` (interviewer evaluations)
- `NotificationLog` (candidate communications)
- `ApplicationFinalStatus` (hiring decisions)

**Migration:** `MigrationRun`, `LegacyMapping` (for data import from legacy systems)

### Layer Rules

| Layer | Responsibility | Dependencies |
|-------|---------------|--------------|
| `domain/` | JPA entities, enums, value objects | None (leaf) |
| `repository/` | Spring Data JPA interfaces | `domain/` |
| `service/` | Business logic, validation | `domain/`, `repository/` |
| `web/` | REST controllers, request/response DTOs | `service/`, `domain/` |

<!-- MANUAL: -->
