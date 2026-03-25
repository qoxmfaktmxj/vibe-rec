# Architecture

This document describes the current implementation on `main`.

## System Shape

`vibe-rec` is a two-app monorepo:

- `apps/web`
  - Next.js 16 App Router
  - server-rendered pages plus thin route-handler BFF endpoints
- `apps/api`
  - Spring Boot 4 API
  - PostgreSQL-backed domain model

The browser talks to the Next.js app. The Next.js app either renders server components directly from the API or proxies browser-facing mutations through route handlers.

## Runtime Boundaries

### Web

The web app owns:
- page routing
- HTTP-only browser cookies for admin and candidate sessions
- proxying authenticated browser requests to the API

The web app does not own:
- auth source of truth
- application ownership rules
- review workflow business rules

Those remain in the Spring API.

### API

The API owns:
- admin and candidate authentication
- session validation
- application draft and submit lifecycle
- attachment ownership and file validation
- applicant review, interview, evaluation, final decision, and notification rules
- Flyway migrations and schema truth

## Main Functional Areas

### Public recruitment

- public job posting list
- public job posting detail
- candidate auth gate before application write actions

Relevant backend area:
- `com.viberec.api.recruitment.jobposting`
- `com.viberec.api.recruitment.application`

Relevant web area:
- `apps/web/src/app/job-postings`
- `apps/web/src/features/recruitment`

### Candidate auth and ownership

- candidate signup
- candidate login
- candidate session lookup
- candidate logout
- candidate-owned draft and attachment actions

Relevant backend area:
- `com.viberec.api.candidate.auth`

Relevant web area:
- `apps/web/src/app/auth/login`
- `apps/web/src/app/me`
- `apps/web/src/shared/api/candidate-auth.ts`
- `apps/web/src/shared/lib/candidate-auth.ts`

### Admin workspace

- admin signup
- admin login
- applicant list and detail
- job posting step lookup for applicant review context
- applicant attachment listing and download
- review status updates
- interviews and evaluations
- final decisions and notifications
- migration history lookup endpoints

Relevant backend area:
- `com.viberec.api.admin.*`
- `com.viberec.api.migration.*`

Relevant web area:
- `apps/web/src/app/admin`
- `apps/web/src/shared/api/admin-*.ts`

## Data Model Overview

### Platform schema

Core tables:
- `platform.admin_account`
- `platform.admin_session`
- `platform.permission`
- `platform.role_permission`
- `platform.admin_account_permission`
- `platform.candidate_account`
- `platform.candidate_session`

### Recruit schema

Core tables:
- `recruit.job_posting`
- `recruit.job_posting_step`
- `recruit.application`
- `recruit.application_resume_raw`
- `recruit.application_attachment`
- normalized resume tables from resume expansion migrations
- interview, evaluation, final decision, and notification tables

Important current rule:
- application ownership is tied to `candidate_account_id`
- applicant display fields remain snapshotted in the application row

## Route Model

### Browser routes

- public:
  - `/`
  - `/job-postings`
  - `/job-postings/[id]`
- candidate:
  - `/auth/login`
  - `/login` redirect
  - `/me`
- admin:
  - `/admin/login`
  - `/admin`
  - `/admin/applicants`
  - `/admin/applicants/[id]`

### API routes

The Spring API is mounted under `/api`.

Key families:
- `/api/ping`
- `/api/job-postings/*`
- `/api/candidate/auth/*`
- `/api/admin/auth/*`
- `/api/admin/applicants/*`
- `/api/admin/job-postings/*`
- `/api/admin/interviews/*`
- `/api/admin/migration/*`
- `/api/admin/attachments/*`
- `/api/applications/*`
- `/api/attachments/*`

## Auth Model

### Candidate

- session token is issued by Spring
- token is stored as an HTTP-only cookie by Next.js
- candidate write actions are forwarded with `X-Candidate-Session`
- anonymous write access is no longer the intended path

### Admin

- session token is issued by Spring
- token is stored as an HTTP-only cookie by Next.js
- admin actions are forwarded with `X-Admin-Session`
- protected admin pages live under the admin protected route group

More detail: [auth-flows.md](auth-flows.md)

## BFF Pattern

The web app contains route handlers under `apps/web/src/app/api/**`.

These handlers:
- read the relevant session cookie
- forward the request to the Spring API
- translate API errors into browser-friendly responses

This keeps browser auth cookie logic out of client components and keeps the API as the system of record.

## What This Repo Does Not Currently Ship

These ideas appeared in older planning docs but are not the current shipped system:
- `/api/v1`
- OTP-based candidate auth
- campaign/tracks public catalog split
- public search architecture beyond the current posting list
- anonymous applicant email as the long-term ownership model

Those plans were intentionally removed from `docs/` because they no longer describe `main`.
