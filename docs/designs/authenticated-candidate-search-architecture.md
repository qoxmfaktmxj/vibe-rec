# Authenticated Candidate Search Architecture

Status: LOCKED_FOR_IMPLEMENTATION
Date: 2026-03-25
Branch: main

## Goal

Replace anonymous candidate submission with authenticated candidate ownership, split new-grad campaign flows from evergreen role flows, add a real public search surface, and separate candidate/admin auth without a big-bang rewrite.

## Source Evidence

- `apps/web/src/app/page.tsx:15` loads all job postings directly into the home page.
- `apps/web/src/features/recruitment/job-postings/JobPostingList.tsx:43` renders a card grid with no search, filtering, or pagination.
- `apps/api/src/main/resources/db/migration/V2__create_recruitment_mvp.sql:1` shows the current `job_posting` schema is brochure-oriented.
- `apps/api/src/main/resources/db/migration/V2__create_recruitment_mvp.sql:34` shows `application` is keyed by posting and raw applicant email.
- `apps/api/src/main/resources/db/migration/V2__create_recruitment_mvp.sql:48` enforces uniqueness on `(job_posting_id, lower(applicant_email))`.
- `apps/api/src/main/java/com/viberec/api/recruitment/application/service/ApplicationDraftService.java:39` upserts drafts by applicant email.
- `apps/web/src/features/recruitment/application/ApplicationDraftForm.tsx:260` uploads attachments using the typed email value.
- `apps/api/src/main/java/com/viberec/api/recruitment/attachment/web/ApplicationAttachmentController.java:31` accepts upload by `jobPostingId + applicantEmail`.
- `apps/api/src/main/java/com/viberec/api/recruitment/attachment/web/AttachmentController.java:20` exposes attachment upload/list/delete without candidate auth.
- `apps/web/src/app/login/page.tsx:7` confirms `/login` is currently admin auth.
- `apps/web/src/shared/api/admin-auth.ts:45` and `apps/web/src/app/api/admin/auth/login/route.ts:6` show an existing BFF + HTTP-only cookie pattern worth reusing.
- `apps/api/src/test/java/com/viberec/api/recruitment/RecruitmentMvpTests.java:15` and `apps/api/src/test/java/com/viberec/api/admin/auth/AdminAuthTests.java:14` show the current backend test pattern is Spring integration tests.

## Locked Decisions

1. Candidate apply flows are authenticated only.
2. New-grad/public cohort recruiting is modeled as a campaign, not as a normal evergreen posting.
3. Evergreen recruiting remains posting-centric.
4. Candidate auth and admin auth use separate route trees, cookies, and API endpoints.
5. Public search ships on PostgreSQL FTS + `pg_trgm`, not on an external search engine.
6. Rollout is staged with dual-compatible schema and feature flags; no big-bang cutover.

## Opinionated Recommendations

### 1. Use separate domain objects for campaigns and evergreen postings

Do not overload `job_posting` with a discriminator and pretend campaign and posting are the same thing. They are not the same workflow, not the same uniqueness rule, and not the same search result.

Recommended model:

- `recruit.recruitment_campaign`
- `recruit.job_posting`
- `recruit.application`

Rules:

- Campaign application target: one application per candidate per campaign.
- Evergreen application target: one application per candidate per job posting.
- Campaigns may expose optional role preferences.
- Job postings may optionally belong to a campaign for discovery, but only one target owns the application.

### 2. Reuse the current BFF pattern for candidate auth, but keep Spring as source of truth

Keep the current split:

- Spring Boot: canonical domain API, auth validation, sessions, search query execution.
- Next.js route handlers: thin cookie-setting BFF for browser flows.

Reason:

- The admin path already does this successfully.
- It minimizes frontend auth churn.
- It keeps HTTP-only cookie logic out of client code.

Do not route every public read through the BFF. Keep BFF for cookie-bound flows and browser multipart/auth mutations. Server components can continue direct server-to-server fetches where appropriate.

### 3. Choose explicit route and endpoint trees

Use explicit route families instead of a single generic "target" abstraction at the HTTP edge.

Public web:

- `/`
- `/jobs`
- `/jobs/:slug`
- `/tracks/:slug`
- `/auth/login`
- `/me`
- `/me/applications`
- `/apply/jobs/:slug`
- `/apply/tracks/:slug`
- `/admin/login`

Spring API:

- `POST /api/v1/candidate/auth/challenges`
- `POST /api/v1/candidate/auth/verify`
- `GET /api/v1/candidate/auth/session`
- `POST /api/v1/candidate/auth/logout`
- `GET /api/v1/public/jobs/search`
- `GET /api/v1/public/jobs/{slug}`
- `GET /api/v1/public/tracks/{slug}`
- `POST /api/v1/candidate/job-postings/{id}/application-draft`
- `POST /api/v1/candidate/job-postings/{id}/application-submit`
- `POST /api/v1/candidate/campaigns/{id}/application-draft`
- `POST /api/v1/candidate/campaigns/{id}/application-submit`
- `GET /api/v1/candidate/applications`
- `GET /api/v1/candidate/applications/{id}`

This is more verbose than a single "apply to anything" endpoint, but it is easier to test, easier to secure, and easier to reason about.

## Proposed Domain Model

### Candidate auth

Add:

- `platform.candidate_account`
- `platform.candidate_session`
- `platform.candidate_login_challenge`

`candidate_account`

- `id`
- `email`
- `normalized_email`
- `email_verified_at`
- `status`
- `last_authenticated_at`
- `created_at`
- `updated_at`

`candidate_session`

- `id`
- `candidate_account_id`
- `token_hash`
- `expires_at`
- `last_seen_at`
- `invalidated_at`
- `created_at`

`candidate_login_challenge`

- `id`
- `candidate_account_id`
- `channel`
- `code_hash`
- `expires_at`
- `consumed_at`
- `attempt_count`
- `created_at`

Notes:

- Reuse the admin session hashing pattern from `AdminAuthService`.
- Do not store raw OTP or raw session token.
- Candidate and admin cookies must be different names and different middleware assumptions.

### Campaigns

Add:

- `recruit.recruitment_campaign`

Fields:

- `id`
- `public_key`
- `slug`
- `title`
- `headline`
- `description`
- `audience_type`
- `application_policy`
- `status`
- `published`
- `opens_at`
- `closes_at`
- `created_at`
- `updated_at`

### Job postings

Extend `recruit.job_posting` with:

- `slug`
- `campaign_id nullable`
- `experience_level`
- `team_name`
- `location_type`
- `search_boost default 0`
- `discoverable default true`

Do not add a generated `search_vector` column yet. Use indexed expressions first.

### Applications

Evolve `recruit.application` in place instead of creating a second application table.

Add:

- `candidate_account_id nullable`
- `application_target_type not null default 'JOB_POSTING'`
- `campaign_id nullable`
- `owner_verified_at nullable`
- `legacy_email_claimed_at nullable`

Change:

- `job_posting_id` from not-null to nullable

Constraint:

- exactly one of `job_posting_id` or `campaign_id` must be set based on `application_target_type`

Keep snapshot columns:

- `applicant_name`
- `applicant_email`
- `applicant_phone`

Reason:

- snapshot fields preserve historical truth for review, notices, and audit
- `candidate_account_id` establishes ownership

Add unique indexes:

- unique `(candidate_account_id, job_posting_id)` where target type is `JOB_POSTING`
- unique `(candidate_account_id, campaign_id)` where target type is `CAMPAIGN`

Keep the legacy email uniqueness index temporarily during rollout.

## Search Architecture

### Query model

Public search supports:

- free text over `title + headline + description`
- target type filters: campaign, evergreen posting
- audience filters: new-grad, experienced, intern, contract
- employment type
- location
- team / discipline
- status
- sort by relevance, newest, closing soon

### PostgreSQL approach

Migration should:

- enable `pg_trgm`
- add GIN index on `to_tsvector('simple', ...)`
- add trigram indexes for title/headline typo resilience

Recommended query shape:

- FTS for primary recall
- trigram fallback for typo tolerance
- deterministic ordering by `rank desc, search_boost desc, opens_at desc, id desc`

Do not adopt Elasticsearch/OpenSearch in this phase. The current scale target does not justify the extra operational surface.

## Route and Data Flow Diagrams

### Public discovery

```text
Home (/)
  |
  +--> Jobs Explorer (/jobs)
  |       |
  |       +--> Evergreen result -> Job Detail (/jobs/:slug)
  |       |
  |       +--> Campaign result -> Track Detail (/tracks/:slug)
  |
  +--> Featured tracks / featured jobs only
```

### Candidate auth + apply

```text
Anonymous user
  |
  +--> Browse / search only
  |
  +--> Click apply
         |
         +--> /auth/login
                 |
                 +--> request OTP
                 +--> verify OTP
                 +--> candidate session cookie set
                 +--> /apply/jobs/:slug or /apply/tracks/:slug
```

### Ownership model

```text
candidate_account
  |
  +--> candidate_session
  |
  +--> application (owner)
          |
          +--> application_resume_raw
          +--> application_attachment
          +--> normalized resume rows
          +--> interview / evaluation / notification
```

## Database Migration Plan

### Phase 1: Auth foundation

Add:

- `platform.candidate_account`
- `platform.candidate_session`
- `platform.candidate_login_challenge`

No existing flow changes yet.

### Phase 2: Campaign and search metadata

Add:

- `recruit.recruitment_campaign`
- new discovery/search columns on `recruit.job_posting`
- FTS and trigram indexes

No existing apply flow changes yet.

### Phase 3: Application ownership and target migration

Add:

- `candidate_account_id`
- `application_target_type`
- `campaign_id`
- ownership timestamps

Relax:

- `job_posting_id` nullability

Backfill:

- create unverified candidate accounts from distinct legacy applicant emails
- attach matching applications by normalized email

This is a dual-compatible phase. Old admin reads still work while new candidate ownership begins to exist.

### Phase 4: Candidate auth reads and writes

Ship:

- candidate auth endpoints
- candidate session cookie
- `/auth/login`
- `/me`

Gate candidate mutations behind auth while leaving public discovery open.

### Phase 5: Search V2 and campaign flows

Ship:

- `/jobs`
- `/tracks/:slug`
- explicit candidate application endpoints

Home stops rendering all postings and becomes a routing surface into search/tracks.

### Phase 6: Anonymous path shutdown

Remove or hard-disable:

- `/job-postings/{id}/application-draft/attachments?applicantEmail=...`
- anonymous draft submit APIs
- public `/login` meaning admin auth

Drop the legacy email uniqueness-only assumptions after candidate ownership is stable.

## Feature Flags

Use reversible rollout flags:

- `candidate_auth_enabled`
- `candidate_apply_gate_enabled`
- `campaign_model_enabled`
- `public_job_search_v2_enabled`
- `legacy_anonymous_apply_disabled`

Suggested sequencing:

1. enable auth reads
2. enable candidate apply gating
3. enable campaign model
4. switch public search
5. disable anonymous flows

## API Boundary Choices

### Keep

- Spring Boot as the canonical API and database owner
- Next.js route handlers for browser auth/session cookie handling
- existing admin auth flow as-is, moved to `/admin/login`

### Add

- candidate BFF route handlers in Next.js for login, logout, and cookie-backed session-aware mutations
- public search page backed by Spring search endpoints

### Avoid

- duplicating domain logic in Next.js
- generic "submit application to any target" endpoint
- coupling public search ranking logic to frontend code

## Failure Modes and Required Handling

| Failure mode | Required handling | Required test |
|---|---|---|
| Two OTP logins race to create the same candidate account | normalized email unique constraint + retry-on-conflict create-or-load logic | integration |
| Legacy applications backfill to wrong ownership | backfill by normalized email only, mark unverified, require first verified login to claim | integration |
| Candidate opens old anonymous attachment URL | return 401/403 after auth gate ships | e2e |
| Admin applicant list breaks when `job_posting_id` becomes nullable | query must resolve title from posting or campaign explicitly | integration |
| Search returns stale/closed data | filter on `published/status/window` at query time, not only in cache | integration |
| Campaign uniqueness blocks evergreen multi-apply | separate partial unique indexes by target type | repository integration |
| `/login` route ambiguity breaks navigation | explicit redirect strategy and route rename | e2e |

Critical silent-failure cases to avoid:

- attachment download without ownership check
- application submit succeeds but ownership not linked
- admin views lose titles when campaign-backed applications appear

## Test Plan

### Existing test pattern

- Backend: Spring integration tests using `IntegrationTestBase`
- Frontend: ad-hoc Playwright specs under `apps/web/tests-temp`

### Required backend tests

- `CandidateAuthTests`
  - creates or reuses candidate account by normalized email
  - rejects expired or consumed OTP challenge
  - resolves and invalidates candidate session
- `PublicSearchTests`
  - searches title/headline/description
  - filters by campaign vs evergreen
  - excludes closed or unpublished targets
  - orders deterministically
- `CandidateApplicationTests`
  - blocks anonymous draft save
  - enforces one-per-campaign uniqueness
  - allows multiple evergreen applications to different postings
  - rejects second application to same evergreen posting
  - attaches ownership timestamps
- `LegacyBackfillTests`
  - creates unverified candidate accounts from legacy applications
  - maps applications to normalized email owner
- `AdminApplicantCompatibilityTests`
  - lists both campaign and evergreen applications correctly

### Required web E2E tests

- candidate search -> login -> apply to evergreen posting
- candidate search -> login -> apply to campaign
- candidate revisits `/me/applications` and sees owned draft/submission
- admin login remains isolated under `/admin/login`
- legacy anonymous attachment route is blocked once the gate is on

### Required migration verification

- Flyway migration smoke test with existing seed data
- backfill row count assertions
- index existence checks for FTS/trigram and partial uniqueness

## What Already Exists

- Admin auth/session token pattern can be mirrored for candidate auth instead of reinvented.
- `application`, `application_resume_raw`, normalized resume tables, interviews, and notifications already center the workflow around `application_id`; this is why the application table should be evolved in place.
- Backend integration test pattern already exists and should be extended instead of introducing a new test harness.
- Next.js already has route-handler-based cookie setting for admin auth; candidate auth should reuse that boundary.

## NOT in Scope

- social login providers
- external search engine cluster
- recommendation/ranking ML
- multi-tenant company support
- full candidate profile reuse across multiple applications beyond ownership and workspace basics

## Implementation Order

1. Route split: `/admin/login` first, `/login` redirect second.
2. Candidate auth foundation and session cookie.
3. Application ownership columns and legacy backfill.
4. Auth-gated candidate apply and attachment ownership checks.
5. Campaign table + admin compatibility updates.
6. Public search V2.
7. Anonymous flow shutdown and cleanup.

## Review Summary

- Step 0: Scope accepted, but implementation is locked as staged migration rather than direct rewrite.
- Architecture Review: 5 major decisions locked.
- Code Quality Review: preserve current BFF boundary; avoid duplicated domain logic.
- Test Review: backend integration pattern exists, frontend coverage is still thin and must expand materially.
- Performance Review: PostgreSQL FTS + trigram is the boring default; external search is deferred.
- NOT in scope: written.
- What already exists: written.
- Failure modes: 3 critical silent-failure cases identified and must be tested before rollout.
