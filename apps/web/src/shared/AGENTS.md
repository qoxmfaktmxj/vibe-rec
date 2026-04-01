<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# shared

## Purpose

Shared utilities, API client functions, and authentication helpers used across all feature domains. This is a leaf layer — it does not import from `features/` or `app/`.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `api/` | Typed fetch wrappers for the Spring Boot API |
| `lib/` | Auth helpers, session cookie management, recruitment status utilities |

## Key Files

### API Clients (`api/`)

| File | Description |
|------|-------------|
| `admin-applicants.ts` | Admin applicant list/detail API calls |
| `admin-hiring.ts` | Hiring decision and notification API calls |
| `admin-interviews.ts` | Interview and evaluation API calls |
| `admin-job-postings.ts` | Admin job posting CRUD API calls |
| `attachments.ts` | File attachment upload/download API calls |
| `candidate-auth.ts` | Candidate signup/login/session API calls |

### Libraries (`lib/`)

| File | Description |
|------|-------------|
| `admin-auth.ts` | Admin session validation and cookie reading |
| `candidate-auth.ts` | Candidate session validation and cookie reading |
| `session-cookie.ts` | HTTP-only cookie read/write utilities |
| `recruitment.ts` | Application status labels, badge color classnames, status utilities |

## For AI Agents

### Working In This Directory

- API client functions are server-side — they read cookies and call the Spring API directly
- `session-cookie.ts` manages HTTP-only cookies; never expose session tokens to client components
- `recruitment.ts` is the single source of truth for status badge styling — use `getApplicationStatusClassName()` and `getApplicationStatusLabel()`
- All API calls forward session headers: `X-Admin-Session` for admin, `X-Candidate-Session` for candidate

<!-- MANUAL: -->
