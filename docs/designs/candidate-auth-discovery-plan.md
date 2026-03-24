# Candidate Auth, Public Discovery, and Campaign Split Plan

Status: LOCKED  
Date: 2026-03-25  
Branch: `main`  
Supersedes: `docs/modernization-plan.md`

## Objective

Lock the engineering plan for these changes before implementation:

1. Replace anonymous candidate applications with candidate-authenticated applications.
2. Separate new-grad campaign flows from evergreen job posting flows.
3. Add public job discovery and search.
4. Split candidate auth from admin auth.

This plan is intentionally additive-first. The current codebase already has usable patterns for admin session management, application lifecycle rules, applicant management, and integration testing. The plan reuses those patterns where possible instead of rewriting the platform.

## Current Constraints and Evidence

- Public home and `/job-postings` both load all postings and render the same card list shape, with no search or pagination.
  - `apps/web/src/app/page.tsx:15`
  - `apps/web/src/app/job-postings/page.tsx:8`
  - `apps/web/src/features/recruitment/job-postings/JobPostingList.tsx:43`
- Public search API does not exist. The current public read side only exposes `GET /job-postings` and `GET /job-postings/{id}`.
  - `apps/web/src/shared/api/recruitment.ts:64`
  - `apps/api/src/main/java/com/viberec/api/recruitment/jobposting/service/JobPostingService.java:25`
- Current `job_posting` is brochure-shaped, not discovery-shaped.
  - `apps/api/src/main/resources/db/migration/V2__create_recruitment_mvp.sql:1`
- Current application identity is email-based, not account-based.
  - `apps/api/src/main/java/com/viberec/api/recruitment/application/service/ApplicationDraftService.java:39`
  - `apps/api/src/main/java/com/viberec/api/recruitment/application/repository/ApplicationRepository.java:15`
  - `apps/api/src/main/resources/db/migration/V2__create_recruitment_mvp.sql:48`
- Public attachment upload/download/delete currently rely on job posting + email or application/attachment id, without candidate ownership checks.
  - `apps/web/src/features/recruitment/application/ApplicationDraftForm.tsx:260`
  - `apps/web/src/app/api/job-postings/[id]/application-draft/attachments/route.ts:34`
  - `apps/web/src/app/api/applications/[id]/attachments/route.ts:20`
  - `apps/web/src/app/api/attachments/[id]/route.ts:20`
  - `apps/web/src/app/api/attachments/[id]/download/route.ts:20`
  - `apps/api/src/main/java/com/viberec/api/recruitment/attachment/web/ApplicationAttachmentController.java:37`
  - `apps/api/src/main/java/com/viberec/api/recruitment/attachment/web/AttachmentController.java:22`
- Public `/login` currently means admin login.
  - `apps/web/src/app/page.tsx:66`
  - `apps/web/src/app/login/page.tsx:7`
- Admin auth already uses the right baseline pattern for reusable session design: opaque token, hashed token persistence, server-side lookup, HTTP-only cookie on the web side, and protected APIs.
  - `apps/api/src/main/java/com/viberec/api/admin/auth/service/AdminAuthService.java:53`
  - `apps/api/src/main/java/com/viberec/api/admin/auth/service/AdminAuthService.java:99`
  - `apps/api/src/main/java/com/viberec/api/admin/auth/web/AdminWebConfig.java:20`

## Locked Product-to-Engineering Decisions

These are no longer open questions in this plan.

1. Candidate login is required before draft creation, attachment upload, and final submit.
2. Candidate auth will use email OTP, not password auth and not magic-link-only auth.
3. Admin auth and candidate auth are different surfaces, different cookies, and different routes.
4. New-grad hiring is modeled as a campaign, not as a normal evergreen posting.
5. Evergreen applications stay one-per-candidate-per-job-posting.
6. Campaign applications stay one-per-candidate-per-campaign, with ranked posting preferences inside the campaign.
7. Search stays on PostgreSQL first. No external search engine in the first implementation.

## Architecture Review

### 1. Domain Model

The core mistake to avoid is trying to make a campaign look like a normal posting. That pushes product complexity into ad-hoc flags and special cases inside services that currently assume one application belongs to one posting.

The target model is:

```text
CandidateAccount
  1 --- * CandidateSession
  1 --- 1 CandidateProfile
  1 --- * Application

RecruitmentCampaign
  1 --- * JobPosting          (campaign tracks / preference targets)

JobPosting
  0..1 --- 1 RecruitmentCampaign
  1 --- * JobPostingStep
  1 --- * Application         (evergreen only)

Application
  * --- 1 CandidateAccount
  0..1 --- 1 JobPosting
  0..1 --- 1 RecruitmentCampaign
  1 --- 0..* ApplicationCampaignPreference
  1 --- 0..* ApplicationAttachment
  1 --- 1 ApplicationResumeRaw
```

### 2. Table Plan

Add these tables:

- `candidate_account`
- `candidate_session`
- `candidate_verification_challenge`
- `candidate_profile`
- `recruitment_campaign`
- `application_campaign_preference`

Change these tables:

- `recruit.application`
  - add `candidate_account_id`
  - add `application_target_type`
  - add nullable `campaign_id`
  - keep `job_posting_id`, but allow `null` for campaign applications
  - keep `applicant_name`, `applicant_email`, `applicant_phone` as immutable submission snapshot fields
- `recruit.job_posting`
  - add nullable `campaign_id`
  - add `discovery_type`
  - add `job_family`
  - add `team_name`
  - add `experience_level`
  - add `published_rank`
  - add `search_document`
- `recruit.application_attachment`
  - no ownership table change required if attachment ownership is derived from `application -> candidate_account`

### 3. `application` Polymorphism Choice

Use one `application` table with explicit target typing instead of splitting into `job_application` and `campaign_application`.

```text
application_target_type = JOB_POSTING | CAMPAIGN

CHECK:
- JOB_POSTING => job_posting_id is not null and campaign_id is null
- CAMPAIGN    => campaign_id is not null and job_posting_id is null
```

Reason:

- The current code already has one application-centric workflow for status, review, raw payload, normalized resume tables, attachments, interviews, evaluations, notifications, and final decisions.
- Reusing one application aggregate minimizes blast radius across admin flows.
- This is more explicit than a hidden "campaign root posting" hack.

Tradeoff:

- The table becomes more conditional.
- Service code must branch on target type.

This is acceptable because it preserves downstream reuse and keeps the migration incremental.

## Database Migration Strategy

### Phase 1. Additive Schema Only

Create new tables and columns without changing current behavior:

- `candidate_account`
- `candidate_session`
- `candidate_verification_challenge`
- `candidate_profile`
- `recruitment_campaign`
- `application_campaign_preference`
- nullable `candidate_account_id` on `application`
- nullable `campaign_id`, `application_target_type` on `application`
- nullable `campaign_id` and discovery/search fields on `job_posting`

Add indexes:

- `candidate_account(lower(email)) unique`
- `candidate_session(token_hash) unique`
- `candidate_verification_challenge(lower(email), purpose, expires_at desc)`
- partial unique index for evergreen:
  - `(candidate_account_id, job_posting_id)` where `application_target_type = 'JOB_POSTING'`
- partial unique index for campaign:
  - `(candidate_account_id, campaign_id)` where `application_target_type = 'CAMPAIGN'`
- `job_posting(search_document)` GIN FTS index
- `job_posting(title gin_trgm_ops)` and `headline gin_trgm_ops` if trigram is enabled

### Phase 2. Backfill Candidate Accounts

Backfill from existing applications:

```text
distinct lower(applicant_email)
    -> candidate_account
    -> application.candidate_account_id
```

Rules:

- If multiple legacy applications share an email, they map to one candidate account.
- `candidate_profile` is seeded from the most recently submitted application snapshot.
- Existing applications remain readable in admin views throughout the backfill.

### Phase 3. Introduce Candidate Auth Without Switching UI

Add candidate auth endpoints and web proxy handlers. Do not remove guest application routes yet.

### Phase 4. Switch Public UI to Candidate-Owned Flow

After candidate auth is live:

- route public login to candidate login
- move admin login to `/admin/login`
- require candidate session for draft/save/submit/attachments

### Phase 5. Enable Discovery Search

Add public `/jobs` and `/campaigns` surfaces and enable search behind a feature flag.

### Phase 6. Enable Campaign Applications

Campaign application creation and preference ranking go live after search and candidate auth are stable.

### Phase 7. Remove Legacy Guest Path

Only after metrics and support checks are clean:

- remove email-based guest endpoints
- remove legacy unique index `(job_posting_id, lower(applicant_email))`
- make `candidate_account_id` required for all new applications

## API Boundary Plan

### Public Read APIs

Keep read APIs public.

- `GET /api/v1/jobs`
- `GET /api/v1/jobs/{slug}`
- `GET /api/v1/campaigns`
- `GET /api/v1/campaigns/{slug}`
- `GET /api/v1/discovery/search`

`/api/v1/discovery/search` returns grouped results, not a polymorphic flat list:

```json
{
  "query": "backend",
  "campaigns": [],
  "jobs": [],
  "meta": {
    "jobCount": 0,
    "campaignCount": 0
  }
}
```

Reason:

- Keeps query planning simpler.
- Lets UI render campaigns and evergreen postings differently.
- Avoids mixing incompatible filter and ranking semantics in one DTO.

### Candidate Auth APIs

Reuse the admin session pattern.

- `POST /api/v1/candidate/auth/challenges`
- `POST /api/v1/candidate/auth/verify`
- `GET /api/v1/candidate/auth/session`
- `DELETE /api/v1/candidate/auth/session`

Web proxy layer in Next.js:

- `/api/candidate/auth/challenges`
- `/api/candidate/auth/verify`
- `/api/candidate/auth/logout`

Cookie:

- `vibe_rec_candidate_session`
- HTTP-only
- secure in production
- SameSite=Lax

### Candidate-Owned Application APIs

- `GET /api/v1/candidate/profile`
- `PATCH /api/v1/candidate/profile`
- `GET /api/v1/candidate/applications`
- `GET /api/v1/candidate/applications/{id}`
- `POST /api/v1/candidate/applications/evergreen`
- `POST /api/v1/candidate/applications/campaign`
- `PATCH /api/v1/candidate/applications/{id}/draft`
- `POST /api/v1/candidate/applications/{id}/submit`
- `POST /api/v1/candidate/applications/{id}/attachments`
- `DELETE /api/v1/candidate/applications/{id}/attachments/{attachmentId}`

Important boundary rule:

- Any endpoint that mutates candidate data must derive candidate identity from session, never from request email.

## Routing Plan

```text
Public
------
/                     brand home
/jobs                 evergreen explorer
/jobs/[slug]          evergreen detail
/campaigns/[slug]     new-grad campaign hub
/auth/login           candidate login
/apply/[targetType]/[slug]
/me
/me/applications
/me/profile

Admin
-----
/admin/login
/admin
/admin/applicants
```

The existing `/login` route must stop being public-facing candidate UI. It becomes a compatibility redirect:

- anonymous user -> `/auth/login`
- admin deep link -> `/admin/login`

## Rollout and Feature Flags

Use server-side flags, not client-only flags.

- `candidate_auth_enabled`
- `candidate_owned_application_enabled`
- `public_discovery_enabled`
- `campaign_applications_enabled`
- `legacy_guest_apply_readonly`

Rollout flow:

```text
Schema add
  -> candidate auth APIs live
  -> candidate auth web routes live
  -> public login split
  -> candidate-owned draft/submit enabled
  -> public discovery enabled
  -> campaign application enabled
  -> guest endpoints disabled
  -> legacy index removed
```

Why flags matter:

- Login split is reversible.
- Candidate session bugs should not block public browsing.
- Campaign application rollout should not block evergreen flows.

## Code Quality Review

### Reuse Instead of Rebuild

These current patterns should be reused, not replaced:

- hashed opaque session tokens
  - `apps/api/src/main/java/com/viberec/api/admin/auth/service/AdminAuthService.java:53`
- server-side protected route interception
  - `apps/api/src/main/java/com/viberec/api/admin/auth/web/AdminWebConfig.java:20`
- application lifecycle state rules
  - `apps/api/src/main/java/com/viberec/api/recruitment/application/service/ApplicationDraftService.java:110`
- normalized resume tables attached to application id
  - `apps/api/src/main/resources/db/migration/V8__create_resume_normalized_tables.sql:1`

### Avoid These Structural Mistakes

Do not:

- overload `job_posting` with dozens of campaign-only flags
- keep candidate ownership implicit via email
- maintain both session auth and one-time email ownership checks in parallel for long-term behavior
- add an external search service before PostgreSQL FTS is saturated

## Performance Review

### Search

Search must ship with:

- pagination from day one
- FTS index on `search_document`
- lightweight summary projections for list results
- no job steps or full description payloads in list endpoints

Target:

- public search P95 < 150 ms for 1,000 active postings

### Candidate Session Lookup

Candidate session should reuse the admin DB lookup pattern, but anonymous pages must not force session lookup unless needed. Keep session reads off pure public pages unless a candidate-specific header or cookie is present.

### Campaign Preferences

Store campaign preferences as ranked rows. Do not serialize ranked preferences into `jsonb` for primary workflow logic. Queryability matters for downstream reporting and audit.

## Failure Modes

| Code Path | Failure | Test Required | Handling | User-visible? | Severity |
|---|---|---|---|---|---|
| OTP request | OTP spam / resend storm | rate-limit integration test | throttle + expiry | clear retry message | High |
| OTP verify | stale code accepted | auth service test | strict expiry + consume-once | clear expired-code message | High |
| Candidate session | cookie exists, DB session invalid | auth session integration test | 401 + cookie clear | yes | High |
| Draft save | candidate session valid but application owned by another candidate | ownership authorization test | 403 | yes | Critical |
| Attachment download | attachment id guessed | ownership authorization test | 404 or 403 | yes | Critical |
| Search | FTS index missing after migration | migration verification test | startup/migration failure | not silent | High |
| Campaign apply | duplicate application race | repository/service concurrency test | unique index + conflict response | yes | High |
| Backfill | same email maps to multiple legacy casing variants | migration test | normalized email merge | no user-facing issue | Medium |
| Admin login split | old `/login` bookmarks break | web route test | redirect compatibility | yes | Medium |

Any path that mutates candidate-owned resources without session-derived ownership must be treated as a release blocker.

## Test Review

### What already exists

- Spring Boot integration tests over the real application context:
  - `apps/api/src/test/java/com/viberec/api/support/IntegrationTestBase.java:1`
- recruitment service tests:
  - `apps/api/src/test/java/com/viberec/api/recruitment/RecruitmentMvpTests.java:16`
- admin auth and authorization integration tests:
  - `apps/api/src/test/java/com/viberec/api/admin/auth/AdminAuthTests.java:14`
  - `apps/api/src/test/java/com/viberec/api/admin/auth/AdminAuthorizationTests.java:24`
- Testcontainers baseline exists on the backend:
  - `apps/api/src/test/java/com/viberec/api/support/TestcontainersConfig.java`
- Web app has no maintained first-class test suite in `package.json` yet:
  - `apps/web/package.json:4`

### Test Diagram

```text
ENGINEERING TEST MATRIX
=======================

[Backend Unit/Service]
  CandidateAuthService
    - issues OTP
    - rejects expired OTP
    - consumes OTP once
    - creates/reuses candidate account
    - creates hashed session token

  CandidateApplicationService
    - creates evergreen draft for session candidate
    - blocks duplicate evergreen apply
    - creates campaign draft for session candidate
    - blocks duplicate campaign apply
    - enforces ownership on draft update
    - enforces submit lock after final submit

  DiscoverySearchService
    - ranks title matches above body matches
    - filters by location / type / audience
    - excludes unpublished or closed entities

[Backend Integration]
  Migration
    - backfills candidate accounts from legacy applications
    - preserves existing application ids
    - preserves admin flows

  Auth + Session
    - challenge -> verify -> session -> logout
    - invalid session -> 401

  Ownership
    - candidate A cannot read candidate B attachment
    - candidate A cannot mutate candidate B draft

[Web / Route Handler]
  Candidate auth route handlers
    - set HTTP-only cookie on verify
    - clear cookie on logout
    - redirect /login correctly

[E2E]
  Evergreen flow
    - browse -> login -> draft -> upload -> submit -> see application in /me

  Campaign flow
    - browse campaign -> login -> rank preferences -> submit -> see status

  Admin safety
    - admin login still works at /admin/login
    - public /auth/login does not leak admin UX
```

## Recommended Test Matrix

### Backend

- Service tests for candidate auth challenge issuance, OTP expiry, OTP replay rejection
- Service tests for application ownership and duplicate submission rules
- Repository/integration tests for partial unique indexes
- Migration tests for candidate-account backfill
- Search integration tests for title/body ranking and filter correctness

### Web

- Route-handler tests for cookie set/clear behavior and redirect behavior
- Route-handler tests that candidate cookie is translated to `X-Candidate-Session`

### E2E

- Candidate evergreen happy path
- Candidate campaign happy path
- candidate tries to access another candidate draft by pasted URL
- session expires mid-draft and recovery UX is clear
- old `/login` bookmark lands in correct place

### Rollout Verification

- guest apply disabled only after candidate flow is healthy
- admin auth unaffected by candidate auth release
- candidate auth unaffected by public discovery release
- backfill counts match distinct legacy email counts before cutover

## Inline ASCII Diagram Comments Required in Implementation

When implementation starts, add and maintain inline ASCII diagrams in these areas:

- `CandidateAuthService` for challenge -> verify -> session flow
- `CandidateApplicationService` for target-type branching and ownership checks
- `DiscoverySearchService` for FTS ranking and filtering pipeline
- `Application` aggregate for target-type state constraints
- migration/backfill runner for legacy application -> candidate account mapping
- end-to-end test setup helpers for candidate/admin dual-auth scenarios

## NOT in Scope

- External search infrastructure
- Resume document library shared across multiple applications
- Social login
- Candidate notifications and email campaigns
- Replacing the existing admin permission model
- Full search analytics and recommendation engine

## Implementation Order

1. Add schema and backfill support.
2. Add candidate auth backend and Next.js proxy routes.
3. Split `/login` into candidate/admin surfaces.
4. Add candidate-owned application endpoints and ownership enforcement.
5. Switch public draft/upload/submit UI to candidate session flow.
6. Add discovery search and `/jobs`.
7. Add campaign model and campaign application flow.
8. Remove guest application path.

## Completion Summary

- Step 0: Scope Challenge -> scope accepted, but execution order reduced to additive rollout
- Architecture Review: 5 issues found and locked
- Code Quality Review: reuse admin session pattern, avoid dual ownership models
- Test Review: diagram produced, candidate auth/search/campaign flows need first-class tests
- Performance Review: PostgreSQL FTS accepted, external search deferred
- NOT in scope: written
- What already exists: written
- TODOS.md updates: none, plan is locked into this document instead
- Failure modes: 3 critical gaps flagged
- Outside voice: skipped
- Lake Score: 4/4 recommendations chose the complete option
