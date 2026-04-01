<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# entities

## Purpose

TypeScript type definitions (interfaces, enums, types) that mirror the Spring Boot API response shapes. This is a leaf layer with no runtime logic — only type declarations.

## Key Files

| File | Description |
|------|-------------|
| `admin/model.ts` | Admin account types |
| `admin/applicant-model.ts` | Admin-facing applicant list/detail response types |
| `candidate/model.ts` | Candidate account and session types |
| `candidate/profile-model.ts` | Candidate profile types |
| `recruitment/model.ts` | Job posting, application, interview, evaluation types |
| `recruitment/attachment-model.ts` | File attachment types |

## For AI Agents

### Working In This Directory

- Types must match the API response shape exactly — check Spring DTOs when modifying
- Shared across `features/` and `shared/api/` layers
- Add new entity files when a new API domain is introduced

<!-- MANUAL: -->
