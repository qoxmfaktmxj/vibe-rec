# Hiring Platform Auth/Search Architecture Plan

Status: LOCKED_FOR_IMPLEMENTATION
Date: 2026-03-25
Branch: main
Owner: Codex /plan-eng-review

## Goal

Lock the implementation plan for turning Vibe Rec from a brochure-style public job list with anonymous application writes into an authenticated candidate workspace with searchable hiring discovery, explicit separation between new-grad campaign flows and evergreen job posting flows, and secure application ownership.

## Step 0: Scope Challenge

Recommendation: keep the CEO direction, but reduce one engineering temptation.

- Keep: candidate email auth, public job search, campaign vs evergreen split, secure attachment ownership, route split for candidate/admin auth.
- Reduce: do not introduce Elasticsearch/OpenSearch, a generic shared auth framework, or a cross-entity search projection table in phase 1.

Opinionated call:
- Use boring extensions of the current stack.
- Reuse the current Spring session-token pattern for candidate auth.
- Reuse the current Next.js proxy route pattern.
- Extend the current `application` lifecycle instead of creating parallel candidate and recruiter review systems.

## Problem Statement

Current public discovery is a static card gallery backed by `GET /job-postings`, and application identity is effectively `(jobPostingId, applicantEmail)`. This blocks three things the product now requires:

1. Public hiring discovery at catalog scale: search, filter, sort, pagination, and campaign-specific entry points.
2. Candidate-owned data: profile, draft continuity, attachment ownership, application history, and status tracking.
3. Distinct operating modes: high-volume new-grad cohort recruiting vs evergreen role-based recruiting.

## Current-State Evidence

- Public home and `/job-postings` both fetch the whole published list and render the same card-grid list without search primitives.
- Anonymous application draft/submit is keyed by applicant email.
- Attachment upload, list, delete, and download are exposed through public routes without candidate authentication.
- Public `/login` currently means admin login.

Relevant code:
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/job-postings/page.tsx`
- `apps/web/src/features/recruitment/job-postings/JobPostingList.tsx`
- `apps/web/src/features/recruitment/application/ApplicationDraftForm.tsx`
- `apps/api/src/main/java/com/viberec/api/recruitment/application/service/ApplicationDraftService.java`
- `apps/api/src/main/resources/db/migration/V2__create_recruitment_mvp.sql`
- `apps/web/src/app/login/page.tsx`
- `apps/web/src/app/api/applications/[id]/attachments/route.ts`
- `apps/web/src/app/api/attachments/[id]/route.ts`
- `apps/web/src/app/api/attachments/[id]/download/route.ts`

## Locked Product/Engineering Decisions

### 1. Candidate auth is mandatory before any write

Browsing remains public.
The following become authenticated candidate-only actions:
- create draft
- update draft
- upload attachment
- delete attachment
- submit application
- view personal application detail/status
- download owned attachment

Chosen auth mode:
- email OTP login

Why OTP instead of password or magic link:
- lower friction than passwords
- more explicit and testable than magic-link redirect flows
- good fit for high-intent recruiting flows
- easy to implement with current Spring + Next proxy architecture

### 2. New-grad recruiting is a campaign, not a posting

Introduce two public discovery objects:
- `RecruitmentCampaign`: cohort-style program entry point for new-grad/intern/high-volume recruiting
- `JobPosting`: evergreen role or campaign child-role

Application policy:
- campaign: one application per candidate per campaign, with ordered role preferences
- evergreen posting: one application per candidate per posting

### 3. Do not unify admin auth and candidate auth yet

Admin auth already exists and works. Candidate auth should copy the same proven token-hash/session pattern with separate tables, service classes, cookie names, and route namespaces.

Do not build:
- generic `AuthService<TUser>`
- shared session table for admin + candidate
- one cookie for both surfaces

This is deliberate duplication to preserve low blast radius and boring rollout.

### 4. Search stays on PostgreSQL first

Chosen stack:
- PostgreSQL full-text search (`tsvector`, `ts_rank`)
- `pg_trgm` for typo-tolerant partial matching on title/slug/team/skill text when needed
- GIN indexes on searchable text

Do not build in phase 1:
- OpenSearch / Elasticsearch
- Meilisearch
- a custom search worker pipeline

For ~1,000 public items, PostgreSQL is sufficient and operationally cheaper.

## Proposed Public Architecture

```text
Public Web
==========
/
|- hero search entry
|- featured campaigns
|- featured evergreen roles
|- trust / hiring info

/jobs
|- query + filters + sort + pagination
|- mixed discovery results
|  |- campaign cards
|  |- evergreen role cards

/tracks/[slug]
|- campaign detail
|- campaign timeline
|- eligible role preferences
|- CTA -> candidate login -> campaign apply flow

/jobs/[slug]
|- evergreen role detail
|- CTA -> candidate login -> posting apply flow

/auth/login
|- email OTP request
|- OTP verification

/me
|- profile
|- applications
|- attachments owned by candidate

/apply/campaign/[slug]
/apply/job/[slug]
```

## Proposed Backend Architecture

```text
Browser
  -> Next route handlers / server actions
    -> Spring REST API
      -> Services
        -> JPA repositories
          -> PostgreSQL
            -> recruit.* and platform.* schemas
```

Proxy strategy:
- keep Next.js route handlers as the browser-facing boundary for cookies and session-aware requests
- keep Spring Boot as the system-of-record API

## Data Model

### New tables

#### `recruit.recruitment_campaign`
- `id`
- `public_key` unique
- `title`
- `headline`
- `description`
- `campaign_type` enum: `NEW_GRAD`, `INTERN`, `EARLY_CAREER`, `OTHER`
- `status` enum: `DRAFT`, `OPEN`, `CLOSED`
- `published` boolean
- `opens_at`, `closes_at`
- `created_at`, `updated_at`

#### `platform.candidate_account`
- `id`
- `primary_email` unique
- `email_verified_at`
- `status` enum: `ACTIVE`, `LOCKED`
- `created_at`, `updated_at`
- `last_authenticated_at`

#### `platform.candidate_session`
- `id`
- `candidate_account_id` fk
- `token_hash` unique
- `expires_at`
- `last_seen_at`
- `invalidated_at`
- `created_at`, `updated_at`

#### `platform.candidate_email_challenge`
- `id`
- `email`
- `code_hash`
- `expires_at`
- `attempt_count`
- `consumed_at`
- `created_at`

#### `recruit.candidate_profile`
- `candidate_account_id` pk/fk
- `name`
- `phone`
- `default_resume_payload` jsonb
- `updated_at`

#### `recruit.application_preference`
- `id`
- `application_id` fk
- `job_posting_id` fk
- `sort_order`
- unique `(application_id, sort_order)`
- unique `(application_id, job_posting_id)`

### Existing-table changes

#### `recruit.job_posting`
Add:
- `campaign_id` nullable fk to `recruitment_campaign`
- `posting_type` enum: `EVERGREEN`, `CAMPAIGN_CHILD`
- `apply_mode` enum: `DIRECT`, `PREFERENCE_ONLY`
- `team_name` nullable
- `job_family` nullable
- `experience_level` nullable
- `search_document` generated or maintained text column
- `search_vector` tsvector

#### `recruit.application`
Add:
- `candidate_account_id` nullable first, later not null
- `target_type` enum: `JOB_POSTING`, `CAMPAIGN`
- `campaign_id` nullable fk
- keep `job_posting_id` but make nullable after migration if campaign applications share this table
- `ownership_claimed_at`
- `last_candidate_seen_at`

Constraints:
- exactly one of `job_posting_id` or `campaign_id` must be non-null
- if `target_type = JOB_POSTING`, `job_posting_id` required
- if `target_type = CAMPAIGN`, `campaign_id` required

Indexes:
- unique `(candidate_account_id, job_posting_id)` where `job_posting_id is not null`
- unique `(candidate_account_id, campaign_id)` where `campaign_id is not null`
- btree on `candidate_account_id`
- btree on `(target_type, status, review_status)`

#### `recruit.application_attachment`
Add:
- no schema identity change needed if attachment stays tied to application
- ownership enforcement moves to service layer via application -> candidate_account mapping

## Migration Strategy

### Phase A. Additive migration only

1. create candidate auth tables
2. create recruitment campaign table
3. add nullable campaign/candidate columns to current tables
4. add search columns and indexes
5. backfill candidate accounts from distinct application emails
6. backfill `application.candidate_account_id`
7. keep current guest-compatible API alive temporarily behind proxies

### Phase B. Dual-read / dual-write transition

1. public reads use new `/jobs` catalog endpoints
2. candidate auth writes create authenticated sessions only
3. anonymous application endpoints return `401/403` from the web tier once auth launches
4. admin views still read the same `application` table

### Phase C. Tighten constraints

1. make `application.candidate_account_id` not null
2. switch uniqueness to candidate-based constraints
3. delete guest-only attachment code paths
4. move public `/login` to `/auth/login`
5. move admin login to `/admin/login`

### Migration note on legacy anonymous applications

Rule:
- create one `candidate_account` per unique historical email
- mark them as `email_verified_at = null`
- when the candidate first logs in with that email, attach ownership and set verified timestamp
- no merge UI in phase 1
- manual support path handles the rare duplicate/human-changed-email case

## API Plan

### Public discovery
- `GET /catalog/search`
- `GET /campaigns/{publicKey}`
- `GET /job-postings/{publicKey}`

`GET /catalog/search` query params:
- `q`
- `types` (`CAMPAIGN`, `JOB_POSTING`)
- `campaignType`
- `employmentType`
- `location`
- `jobFamily`
- `experienceLevel`
- `sort` (`relevance`, `newest`, `closingSoon`)
- `page`
- `pageSize`

Response shape:
- `items`
- `total`
- `page`
- `pageSize`
- `facets`

### Candidate auth
- `POST /candidate/auth/start-email-login`
- `POST /candidate/auth/verify-email-login`
- `GET /candidate/auth/session`
- `POST /candidate/auth/logout`

Cookie:
- `vibe_rec_candidate_session`
- httpOnly
- secure in prod
- sameSite=lax

### Candidate workspace
- `GET /candidate/profile`
- `PUT /candidate/profile`
- `GET /candidate/applications`
- `GET /candidate/applications/{id}`
- `POST /candidate/applications/job/{jobPostingPublicKey}`
- `POST /candidate/applications/campaign/{campaignPublicKey}`
- `PATCH /candidate/applications/{id}/draft`
- `POST /candidate/applications/{id}/submit`
- `GET /candidate/applications/{id}/attachments`
- `POST /candidate/applications/{id}/attachments`
- `DELETE /candidate/applications/{id}/attachments/{attachmentId}`

### Admin impact

Keep current admin auth endpoints and permission model.
Admin application read side evolves to include:
- target title
- target type
- candidate account id
- campaign preference summary if campaign application

## Search Design

### Query execution

```text
User query
  -> validate + normalize params
  -> run bounded search against campaigns and evergreen postings
  -> rank in SQL using FTS score + freshness tie-break
  -> merge response into one paginated catalog payload
  -> return facets and counts
```

### Ranking rules
- primary: text relevance (`ts_rank`)
- secondary: open status
- tertiary: closing soon boost
- fallback: newest publish/open date

### Index plan
- `CREATE EXTENSION IF NOT EXISTS pg_trgm`
- GIN index on `job_posting.search_vector`
- GIN index on `recruitment_campaign.search_vector`
- trigram indexes on `title`, `public_key`, `team_name`, `location` only if needed after profiling

### Performance guardrails
- page size hard cap: 50
- return only public fields in catalog result
- no N+1 joins for step counts or preference counts
- use explain plans before rollout
- target P95 search latency: <150ms at 1,000 public items

## Candidate Auth Design

### OTP flow

```text
candidate enters email
  -> create challenge row + hashed OTP + expiry
  -> send OTP email
  -> candidate submits code
  -> verify challenge
  -> find-or-create candidate account
  -> create candidate session
  -> set httpOnly cookie
```

Constraints:
- OTP TTL: 10 minutes
- max attempts per challenge: 5
- resend cooldown: 60 seconds
- max challenge creates per email/IP per hour: configurable

### Why not passwords in phase 1
- unnecessary credential lifecycle overhead
- worse recovery UX
- no product need yet beyond email ownership proof

## Secure Attachment/Application Ownership

Rule:
- every candidate-owned read/write action resolves candidate session first
- application must belong to the authenticated candidate
- admin access remains permission-gated separately

Delete these behaviors:
- upload via `applicantEmail` query param
- list attachments by public `applicationId` without ownership
- delete/download by naked `attachmentId` without candidate or admin authorization

## Route Plan in Next.js

### Public
- `/`
- `/jobs`
- `/tracks/[slug]`
- `/jobs/[slug]`

### Candidate
- `/auth/login`
- `/me`
- `/me/applications`
- `/me/profile`
- `/apply/job/[slug]`
- `/apply/campaign/[slug]`

### Admin
- `/admin/login`
- `/admin`
- `/admin/applicants`

### Removal/redirect plan
- `/login` -> redirect to `/auth/login` once candidate auth ships
- admin links updated to `/admin/login`

## Rollout Strategy

```text
Phase 1: schema + backend auth endpoints + search endpoints behind flags
Phase 2: public /jobs and candidate /auth/login ship dark
Phase 3: attachment ownership routes switched to candidate auth
Phase 4: anonymous draft/submit disabled
Phase 5: campaign applications enabled for new-grad launch
```

Feature flags:
- `candidateAuthEnabled`
- `publicCatalogEnabled`
- `campaignApplicationsEnabled`
- `guestApplyDisabled`

Reversibility:
- public search can roll back to existing `/job-postings`
- candidate auth launch can be gated by flag
- anonymous writes disabled only after migration validation
- schema changes are additive until final tightening step

## What Already Exists

- Admin auth/session pattern exists and should be copied, not generalized prematurely.
- Recruiter application list/detail/review workflows already center on `application`, which is worth preserving as the core lifecycle aggregate.
- Backend integration test base and Testcontainers support already exist.
- Basic recruitment read/write MVP exists for job posting detail, draft save, submit lock, and review status transitions.

Reuse plan:
- reuse admin auth session/hash pattern for candidate auth
- reuse `application` as the core lifecycle entity
- reuse Spring + Flyway + Testcontainers testing approach
- reuse Next proxy route pattern for browser-facing auth/session cookies

## NOT in Scope

- external search engine adoption
- social login
- password-based candidate auth
- candidate account merge UI
- saved job alerts / notifications
- recommendation engine
- recruiter-side workflow redesign beyond target metadata exposure
- generic auth framework for all actor types

## Code Quality / Architecture Issues to Avoid During Implementation

1. Do not build parallel application tables for candidate and admin views.
2. Do not make campaign applications fake job postings just to reuse old routes.
3. Do not encode ownership in browser-visible query params.
4. Do not couple search UI state to local-only client state; keep URL as source of truth.
5. Do not make the home page a second catalog page.

## Test Review

### Existing test pattern
- backend uses Spring Boot integration tests with Testcontainers-ready infrastructure
- frontend has no stable first-class unit/integration test harness yet
- frontend browser coverage exists only as temporary Playwright specs under `tests-temp`

### Code-path coverage map

```text
CODE PATH COVERAGE
===========================
[+] Current authenticated write path foundations
    |- [TESTED] backend draft save happy path
    |- [TESTED] backend submit happy path
    |- [TESTED] submit lock after final submission
    |- [TESTED] closed posting rejects draft save

[+] Planned candidate auth path
    |- [GAP] request OTP for valid email
    |- [GAP] reject expired OTP
    |- [GAP] reject reused OTP
    |- [GAP] rate-limit repeated OTP requests
    |- [GAP] candidate session cookie refresh / logout

[+] Planned discovery/search path
    |- [GAP] empty query returns default open catalog
    |- [GAP] title/body relevance ranking
    |- [GAP] campaign + evergreen mixed result pagination
    |- [GAP] closed items excluded from public catalog
    |- [GAP] filter combinations produce stable counts

[+] Planned ownership path
    |- [GAP] candidate can list own attachments
    |- [GAP] candidate cannot access another candidate attachment
    |- [GAP] admin can still access attachment with permission
    |- [GAP] submitted application blocks attachment mutation

[+] Planned campaign application path
    |- [GAP] one candidate cannot apply twice to same campaign
    |- [GAP] role preferences preserve order
    |- [GAP] campaign application submit snapshots current profile
    |- [GAP] evergreen application uniqueness remains per posting
```

### User-flow coverage map

```text
USER FLOW COVERAGE
===========================
[+] Current flows
    |- [TESTED-ish] admin login -> dashboard (temporary Playwright)
    |- [TESTED-ish] admin nav active state (temporary Playwright)

[+] Required new flows
    |- [GAP][E2E] public search -> job detail -> login -> apply -> submit
    |- [GAP][E2E] public search -> campaign detail -> login -> choose preferences -> submit
    |- [GAP][E2E] candidate returns later -> sees existing draft -> edits -> submits
    |- [GAP][E2E] candidate attempts attachment download for non-owned app -> blocked
    |- [GAP][E2E] admin opens migrated legacy application -> target metadata renders correctly
```

### Required automated coverage

#### Unit tests
- OTP generation/verification rules
- search param normalization
- search ranking tie-break rules
- application uniqueness policy by target type
- campaign preference ordering validation
- cookie parsing/session helpers in web layer

#### Integration tests
- candidate auth controller + session lifecycle
- search queries against PostgreSQL FTS indexes
- migration backfill from anonymous application email to candidate account
- attachment authorization checks
- campaign + evergreen application constraints
- admin read side still works against mixed target types

#### E2E tests
- candidate login and application submit journey
- candidate draft resume continuation
- campaign preference selection and resubmission rules
- route split correctness (`/auth/login` vs `/admin/login`)
- unauthorized attachment access rejection

## Failure Modes

| Codepath | Failure mode | Test planned | Error handling planned | Silent failure risk |
|---|---|---|---|---|
| OTP verify | expired or replayed code accepted | yes | yes | no |
| Candidate session | cookie missing after verify | yes | yes | no |
| Search | closed campaign leaks into public results | yes | yes | no |
| Search | filter + pagination mismatch returns unstable counts | yes | yes | no |
| Attachment download | candidate can fetch another user's file by id | yes | yes | critical today |
| Campaign apply | duplicate double-submit creates two applications | yes | yes | no |
| Migration backfill | same email case variants create duplicate candidate rows | yes | yes | no |
| Admin mixed target read | recruiter UI assumes every application has job_posting only | yes | yes | no |

Current critical gap:
- attachment ownership paths are exposed without candidate auth in the current system, so user-owned file access can fail open if route identifiers are known.

## Performance Review

Risks:
- catalog search using plain `LIKE` on long text will degrade quickly and produce poor ranking
- mixed campaign/posting result aggregation can cause inconsistent paging if SQL ordering is not deterministic
- repeated per-row step or preference lookups can create N+1 behavior in catalog/admin views

Mitigations:
- FTS + deterministic ordering
- bounded page sizes
- fetch only summary DTOs for catalog
- precompute or aggregate step counts in query instead of per-item lazy access

## Inline ASCII Diagram Comments to Add During Implementation

Add and maintain inline ASCII comments in these future implementation files:
- `CandidateAuthService` -> OTP and session state flow
- `CatalogSearchService` -> search/ranking pipeline
- `ApplicationPolicyService` -> target-type uniqueness rules
- `CampaignApplicationService` -> preference ordering / submit pipeline
- `AttachmentAuthorizationService` -> ownership decision tree
- integration tests covering migration/backfill -> setup explanation diagram

## Implementation Sequence

1. Add candidate auth tables and services.
2. Backfill candidate accounts from existing applications.
3. Add campaign table and extend job posting/application schema.
4. Ship `/auth/login` and candidate session plumbing behind a flag.
5. Add `/jobs` catalog search and `/tracks/[slug]` read side.
6. Move apply UI from anonymous embedded form into authenticated flows.
7. Lock attachment ownership.
8. Disable guest application endpoints.
9. Promote campaign application flow for new-grad recruiting.

## Practical QA Test Plan Artifact

### Affected pages/routes
- `/` -> home no longer renders full catalog; verify discovery entry points only
- `/jobs` -> search, filter, sort, pagination, mixed result rendering
- `/tracks/[slug]` -> campaign detail, timeline, preference-based apply CTA
- `/jobs/[slug]` -> evergreen role detail, direct apply CTA
- `/auth/login` -> OTP request/verify/session establishment
- `/me/applications` -> owned applications only
- `/apply/job/[slug]` -> draft and submit lifecycle
- `/apply/campaign/[slug]` -> campaign preference flow
- `/admin/login` -> admin path remains separate
- `/admin/applicants` -> mixed target applications readable by recruiters

### Key interactions to verify
- candidate can authenticate with OTP and resume a draft
- candidate cannot create duplicate application for same campaign/posting
- candidate can manage only owned attachments
- admin still sees migrated legacy applications and new candidate-owned applications in one workflow
- search excludes closed targets and respects filters/sort consistently

### Edge cases
- double-click submit
- stale OTP
- expired session during upload
- campaign closes between draft and submit
- case-insensitive email backfill migration
- empty search query with filters only

## Completion Summary

- Step 0: Scope Challenge - scope accepted with one reduction: no external search engine or shared generic auth layer
- Architecture Review: 6 issues found
- Code Quality Review: 5 issues found
- Test Review: diagram produced, 17 gaps identified
- Performance Review: 3 issues found
- NOT in scope: written
- What already exists: written
- TODOS.md updates: 0 items proposed in this document
- Failure modes: 1 current critical gap flagged
- Outside voice: pending external agent summaries
- Lake Score: 4/4 recommendations chose the complete option inside the current stack

## References

- `apps/web/src/app/page.tsx:15` - home fetches full job postings and current admin session.
- `apps/web/src/app/job-postings/page.tsx:9` - dedicated postings page also fetches the full job postings list with no search params.
- `apps/web/src/features/recruitment/job-postings/JobPostingList.tsx:43` - public job list is a pure card grid with direct apply CTA and no discovery controls.
- `apps/web/src/features/recruitment/application/ApplicationDraftForm.tsx:260` - attachment upload depends on applicant email input.
- `apps/web/src/features/recruitment/application/ApplicationDraftForm.tsx:397` - draft and submit still post anonymously from the public detail page.
- `apps/web/src/app/login/page.tsx:7` - public `/login` is currently admin login.
- `apps/web/src/app/api/applications/[id]/attachments/route.ts:20` - application attachment list/upload proxy is public and keyed by application id.
- `apps/web/src/app/api/attachments/[id]/route.ts:20` - attachment delete proxy is public and keyed by attachment id.
- `apps/web/src/app/api/attachments/[id]/download/route.ts:20` - attachment download proxy is public and keyed by attachment id.
- `apps/web/src/app/api/job-postings/[id]/application-draft/attachments/route.ts:34` - public upload proxy forwards `applicantEmail` query param.
- `apps/web/package.json:5` - web app currently has no first-class `test` script.
- `apps/api/src/main/resources/db/migration/V2__create_recruitment_mvp.sql:1` - current schema defines job postings without campaign/candidate abstractions.
- `apps/api/src/main/resources/db/migration/V2__create_recruitment_mvp.sql:48` - current uniqueness is `(job_posting_id, lower(applicant_email))`.
- `apps/api/src/main/java/com/viberec/api/recruitment/application/service/ApplicationDraftService.java:39` - draft save resolves by applicant email.
- `apps/api/src/main/java/com/viberec/api/recruitment/application/service/ApplicationDraftService.java:64` - submit path also resolves by applicant email.
- `apps/api/src/main/java/com/viberec/api/recruitment/attachment/web/ApplicationAttachmentController.java:38` - upload-by-email attachment path exists in backend.
- `apps/api/src/main/java/com/viberec/api/recruitment/attachment/web/AttachmentController.java:22` - attachment list/upload/delete routes operate by application or attachment id.
- `apps/api/src/test/java/com/viberec/api/support/IntegrationTestBase.java:5` - backend test pattern uses `@SpringBootTest` integration tests.
- `apps/api/src/test/java/com/viberec/api/recruitment/RecruitmentMvpTests.java:38` - recruitment MVP tests cover draft/submit basics only.
- `apps/api/src/test/java/com/viberec/api/admin/auth/AdminAuthTests.java:43` - admin auth tests provide the reuse pattern for candidate session testing.
- `apps/web/tests-temp/qa-round3.spec.cjs:3` - current browser coverage is temporary Playwright spec, not stable suite.
