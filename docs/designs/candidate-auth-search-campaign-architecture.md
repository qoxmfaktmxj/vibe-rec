# Candidate Auth + Search + Campaign Architecture Lock

Status: LOCKED FOR IMPLEMENTATION  
Date: 2026-03-25  
Branch: main  
Supersedes: `docs/modernization-plan.md`

## 0. Scope Challenge

결론: 제품 scope는 유지한다. 다만 구현 순서는 재배치한다.

- 유지하는 end-state scope
  - 후보자 이메일 로그인
  - 비회원 지원 완전 제거
  - 공개 채용 탐색 화면
  - 신입/공채 캠페인과 상시 채용 분리
  - 후보자 대시보드
  - 관리자/후보자 인증 분리
- 재배치하는 implementation order
  - 1차: 후보자 인증 + 소유권 + 관리자 로그인 경로 분리
  - 2차: 공개 채용 탐색과 검색
  - 3차: 신입 캠페인 도메인
  - 4차: 전형 snapshot과 admin 확장

이유:

- 현재 시스템은 `job_posting -> anonymous application` 전제라서 search, auth, ownership, campaign을 한 번에 뒤집어야 한다.
- 하지만 인터뷰/평가/관리자 기능은 이미 일부 동작 중이므로 big bang rewrite 대신 strangler sequence가 맞다.

## 1. Problem Statement

현재 공개 영역은 "몇 개 공고를 보여주고 바로 지원 받는 랜딩"에 가깝다.

- 홈과 `/job-postings`가 모두 전체 공고 카드 목록을 보여준다.
- 후보자 식별은 계정이 아니라 이메일 문자열이다.
- 첨부파일과 지원서 소유권이 계정 기준으로 검증되지 않는다.
- 신입/공채와 상시채용이 동일한 `job_posting` 모델에 묶여 있다.

이 구조는 다음 요구를 만족하지 못한다.

1. 공고 1000개 규모에서 빠른 검색/필터/정렬
2. 후보자 계정 기반 임시저장/재지원/내 지원현황
3. 신입 대량채용과 상시채용의 다른 UX/운영 모델
4. 첨부파일과 지원서의 명시적 ownership

## 2. What Already Exists

| Existing asset | Evidence | Reuse decision | Why |
|---|---|---|---|
| Admin session hashing and cookie flow | `apps/api/src/main/java/com/viberec/api/admin/auth/service/AdminAuthService.java` | Reuse pattern | 후보자 세션에도 동일한 token-hash 패턴이 적합하다. |
| Public job posting read side | `apps/api/src/main/java/com/viberec/api/recruitment/jobposting/service/JobPostingService.java` | Reuse partially | evergreen listing/detail의 source table은 유지한다. |
| Application draft/submit service | `apps/api/src/main/java/com/viberec/api/recruitment/application/service/ApplicationDraftService.java` | Rewrite boundary only | save/update business semantics는 유지하되 candidate session 기반으로 바꾼다. |
| Applicant admin list/detail | `apps/api/src/main/java/com/viberec/api/admin/applicant/web/AdminApplicantController.java` | Extend | campaign/applicationType filters만 추가한다. |
| File storage | `apps/api/src/main/java/com/viberec/api/recruitment/attachment/service/FileStorageService.java` | Reuse | 저장소 abstraction은 유지하고 ownership check만 바꾼다. |
| Backend integration test pattern | `apps/api/src/test/java/com/viberec/api/support/IntegrationTestBase.java` | Reuse | SpringBoot + Testcontainers 통합테스트 패턴 유지. |
| Frontend structure | `apps/web/src/app`, `apps/web/src/features` | Reuse partially | route split과 feature 추가는 하되 framework 교체는 없다. |

## 3. NOT in Scope

- Elasticsearch/OpenSearch 도입
  - PostgreSQL FTS + `pg_trgm`으로 현재 요구를 충분히 처리 가능하다.
- Social login / OAuth
  - 요구사항은 이메일 로그인이고, 채용 지원의 ownership 증명에는 이메일 OTP가 더 직접적이다.
- Candidate password auth
  - 비밀번호 reset/보안운영 복잡도만 늘리고 핵심 가치가 낮다.
- Resume AI parsing / ranking / recommendation
  - search/auth/campaign ownership을 먼저 해결해야 한다.
- Candidate document vault reuse
  - v1에서는 application attachment를 유지한다. 문서 재사용 vault는 추후 과제다.
- Search autosuggest service 분리
  - 데이터량과 complexity 대비 과하다.

## 4. Locked Decisions

### 4.1 Candidate writes require candidate session

비로그인 허용 범위:

- 홈
- `/jobs`
- `/jobs/:slug`
- `/tracks/:slug`

로그인 required:

- 임시저장
- 최종 제출
- 첨부파일 업로드/삭제/다운로드
- 내 지원현황
- 내 프로필

### 4.2 Candidate auth uses email OTP, not password, not magic-link-first

선택:

- 기본 로그인 방식은 6-digit email OTP
- OTP 만료 10분
- 최대 5회 실패
- resend cooldown 60초
- email + IP 기준 rate limit 적용

이유:

- magic link는 cross-device/open-mail context가 흔들릴 수 있다.
- OTP는 explicit하고 support/debug가 쉽다.
- 비밀번호는 운영복잡도 대비 효익이 낮다.

### 4.3 Admin login moves to `/admin/login`

Route policy:

- `/admin/login` : 관리자 로그인 canonical path
- `/auth/login` : 후보자 로그인 canonical path
- `/login` : `/auth/login`으로 redirect
- `/admin` guard 실패 시 `/admin/login`으로 이동

### 4.4 Search is unified in the API contract, not the storage contract

DB는 명시적 테이블을 유지한다.

- evergreen: `job_posting`
- new-grad/program: `recruitment_campaign`, `recruitment_campaign_track`

하지만 공개 검색 응답은 단일 `OpportunityCard` contract로 합친다.

즉, UI는 unified search를 보지만 DB는 억지 generic table로 합치지 않는다.

### 4.5 New-grad is a first-class campaign, not a fake job posting

신입/공채는 `RecruitmentCampaign` 이다.

- 하나의 캠페인이 여러 track을 가진다.
- 지원은 캠페인 단위 1회 제출이다.
- track preference는 별도 preference table로 관리한다.

상시채용은 `JobPosting` 이다.

- 개별 공고별 지원
- 검색 결과에서 바로 상세로 이동

### 4.6 Application remains a unified dossier, but target is explicit

`application`은 계속 단일 지원서 헤더 테이블을 유지한다.  
대신 target이 명시된다.

- `application_type = JOB_POSTING | CAMPAIGN`
- `job_posting_id` nullable
- `campaign_id` nullable
- exactly-one-target check constraint

이 선택으로 admin applicant list, attachments, interviews, final decisions를 한 support surface로 유지한다.

### 4.7 Interviews move to application-stage snapshots

현재 interview는 `job_posting_step_id`에 직접 묶인다.  
campaign이 들어오면 mutable template에 runtime state가 종속되는 문제가 생긴다.

end-state에서는 다음으로 바꾼다.

- template step
  - `job_posting_step`
  - `campaign_step`
- runtime snapshot
  - `application_stage`
- `interview.application_stage_id` FK

이렇게 해야:

- 공고/캠페인 전형 변경이 과거 지원자 timeline을 오염시키지 않는다.
- evergreen와 campaign을 하나의 운영 surface로 다룰 수 있다.

### 4.8 No external search engine in v1

v1 search stack:

- PostgreSQL full-text search
- `pg_trgm`
- GIN indexes
- union query + relevance ranking

## 5. Target Routes

```text
/                       marketing home
/jobs                   public search
/jobs/:slug             evergreen posting detail
/tracks/:slug           campaign detail
/auth/login             candidate email OTP login
/me                     candidate dashboard landing
/me/profile             candidate profile
/me/applications        candidate applications list
/me/applications/:id    candidate application detail
/admin/login            admin login
/admin                  admin shell
/admin/applicants       applicant operations
```

## 6. Target Domain Model

### 6.1 Entity map

```text
platform.candidate_account
  1 --- * platform.candidate_session
  1 --- * platform.candidate_login_challenge
  1 --- * recruit.application

recruit.job_posting
  1 --- * recruit.job_posting_step
  1 --- * recruit.application (JOB_POSTING)

recruit.recruitment_campaign
  1 --- * recruit.recruitment_campaign_track
  1 --- * recruit.campaign_step
  1 --- * recruit.application (CAMPAIGN)

recruit.application
  1 --- 1 recruit.application_resume_raw
  1 --- * recruit.application_attachment
  1 --- * recruit.application_stage
  1 --- * recruit.application_track_preference

recruit.application_stage
  1 --- * recruit.interview
```

### 6.2 New tables

#### `platform.candidate_account`

```text
id
email (unique, lowercased)
full_name nullable
phone nullable
email_verified_at nullable
status (ACTIVE, LEGACY_CLAIMABLE, LOCKED)
last_login_at nullable
created_at
updated_at
```

#### `platform.candidate_login_challenge`

```text
id
candidate_account_id nullable
email
otp_hash
expires_at
consumed_at nullable
attempt_count
last_attempt_at nullable
requested_ip
user_agent
created_at
```

#### `platform.candidate_session`

```text
id
candidate_account_id
token_hash
expires_at
last_seen_at
created_at
invalidated_at nullable
```

#### `recruit.recruitment_campaign`

```text
id
slug (unique)
title
headline
description
campaign_kind (NEW_GRAD, INTERN, FELLOWSHIP, etc.)
location_summary
status
published
opens_at
closes_at
created_at
updated_at
```

#### `recruit.recruitment_campaign_track`

```text
id
campaign_id
slug
track_code
title
headline
description
employment_type
location
team nullable
sort_order
search_weight default 1
published
created_at
updated_at
```

#### `recruit.campaign_step`

```text
id
campaign_id
step_order
step_type
title
description
starts_at nullable
ends_at nullable
```

#### `recruit.application_track_preference`

```text
application_id
campaign_track_id
sort_order
```

#### `recruit.application_stage`

```text
id
application_id
source_type (JOB_POSTING_STEP, CAMPAIGN_STEP)
source_step_id
step_order
step_type
title
description
stage_status (PENDING, ACTIVE, COMPLETED, SKIPPED, CANCELLED)
starts_at nullable
ends_at nullable
created_at
updated_at
```

### 6.3 Existing table changes

#### `recruit.application`

keep:

- resume snapshot
- review status
- final decision
- timestamps

add:

```text
candidate_id not null
application_type not null
campaign_id nullable
job_posting_id nullable
```

constraints:

```text
exactly one of (job_posting_id, campaign_id) must be set
application_type must match the populated FK
unique(candidate_id, job_posting_id) where job_posting_id is not null
unique(candidate_id, campaign_id) where campaign_id is not null
```

#### `recruit.interview`

change:

```text
drop direct dependency on job_posting_step_id
add application_stage_id not null
```

## 7. Data Flow

### 7.1 Candidate login flow

```text
[Candidate email submit]
        |
        v
[Create or find candidate_account]
        |
        v
[Create login_challenge + hash OTP + rate-limit check]
        |
        v
[Send OTP email]
        |
        v
[Candidate enters code]
        |
        +--> invalid/expired/rate-limited --> [clear error + no session]
        |
        v
[Verify hash + consume challenge]
        |
        v
[Create candidate_session cookie]
        |
        v
[Redirect to returnTo]
```

Shadow paths:

- email delivery fails
- OTP expired
- OTP replay
- too many attempts

### 7.2 Public search flow

```text
[GET /jobs?q=...&filters...]
        |
        v
[Search service]
   |                  |
   |                  +--> query job_posting FTS index
   |
   +--> query campaign_track FTS index
        |
        v
[Normalize to OpportunityCard]
        |
        v
[Sort + paginate + facets]
        |
        v
[Search response]
```

### 7.3 Evergreen application flow

```text
[Candidate session]
        |
        v
[Open /jobs/:slug]
        |
        v
[Save draft]
        |
        +--> find existing application by (candidate_id, job_posting_id)
        |       |
        |       +--> exists + editable -> update
        |       +--> missing -> create
        |
        v
[Submit]
        |
        v
[Lock application + materialize application_stage]
```

### 7.4 Campaign application flow

```text
[Candidate session]
        |
        v
[Open /tracks/:slug]
        |
        v
[Select track preferences]
        |
        v
[Save draft by (candidate_id, campaign_id)]
        |
        v
[Submit]
        |
        v
[Lock campaign application + create track preferences + materialize application_stage]
```

### 7.5 Attachment ownership flow

```text
[Candidate requests attachment action]
        |
        v
[Resolve candidate_session]
        |
        v
[Load application by id]
        |
        +--> application.candidate_id != session.candidate_id --> 403
        |
        +--> application.status == SUBMITTED and action is mutate --> 409
        |
        v
[Allow upload/list/download/delete]
```

## 8. Public Search Contract

### 8.1 Response type

```ts
type OpportunityCard = {
  id: number;
  opportunityType: "JOB_POSTING" | "CAMPAIGN_TRACK";
  slug: string;
  title: string;
  headline: string;
  descriptionSnippet: string;
  audience: "EXPERIENCED" | "NEW_GRAD";
  employmentType: string | null;
  location: string | null;
  team: string | null;
  status: "OPEN" | "CLOSED";
  opensAt: string | null;
  closesAt: string | null;
  campaignSlug?: string;
  campaignTitle?: string;
  stepCount?: number;
};
```

### 8.2 API endpoints

Public:

- `GET /api/jobs`
- `GET /api/jobs/{slug}`
- `GET /api/tracks/{slug}`

Candidate auth:

- `POST /api/auth/email/start`
- `POST /api/auth/email/verify`
- `GET /api/auth/session`
- `POST /api/auth/logout`

Candidate:

- `GET /api/me`
- `PATCH /api/me`
- `GET /api/me/applications`
- `GET /api/me/applications/{id}`
- `POST /api/jobs/{slug}/application-draft`
- `POST /api/jobs/{slug}/application-submit`
- `POST /api/tracks/{slug}/application-draft`
- `POST /api/tracks/{slug}/application-submit`
- `GET /api/me/applications/{id}/attachments`
- `POST /api/me/applications/{id}/attachments`
- `DELETE /api/me/attachments/{id}`
- `GET /api/me/attachments/{id}/download`

Admin:

- `POST /api/admin/auth/login`
- `GET /api/admin/auth/session`
- `POST /api/admin/auth/logout`
- `GET /api/admin/applicants`
- `GET /api/admin/applicants/{id}`
- `PATCH /api/admin/applicants/{id}/review-status`
- `GET /api/admin/opportunities`
- `GET /api/admin/campaigns`

## 9. Database Search Strategy

### 9.1 Extensions

- `pg_trgm`
- `unaccent`

### 9.2 Index strategy

`job_posting`

- tsvector derived from `title`, `headline`, `description`, `location`
- GIN on search vector
- trigram index on normalized title/headline
- btree on `(published, status, opens_at, closes_at)`

`recruitment_campaign_track`

- tsvector derived from `title`, `headline`, `description`, `team`, `location`
- GIN on search vector
- trigram index on normalized title/headline
- btree on `(campaign_id, published, sort_order)`

### 9.3 Ranking

1. exact title match
2. trigram title similarity
3. FTS rank
4. opens_at desc
5. id desc

### 9.4 Facets

v1 facets:

- audience
- employmentType
- location
- team
- closingSoon

## 10. Migration Plan

### Phase 1. Candidate auth + ownership hardening

Flyway:

- V13 create candidate tables
- V14 add `candidate_id` to `recruit.application`
- V15 backfill candidate rows from distinct `lower(applicant_email)`
- V16 add partial unique indexes by candidate target

Application migration:

```text
distinct lower(applicant_email)
        |
        v
create candidate_account(status=LEGACY_CLAIMABLE)
        |
        v
update application.candidate_id
        |
        v
keep applicant_email column as contact/snapshot
```

Rules:

- old unique `(job_posting_id, lower(applicant_email))` remains until candidate unique indexes verified
- existing applications become claimable by OTP login on the same email

### Phase 2. Route split + secure candidate APIs

- move admin login page to `/admin/login`
- add `/auth/login`
- rewrite web proxy routes so candidate session is mandatory for all write paths
- remove `applicantEmail` query-param upload path

### Phase 3. Public search v2

- add `/jobs` search UI
- add new search API
- home becomes search entry + featured opportunities

### Phase 4. Campaign domain

- create campaign tables
- add `/tracks/:slug`
- support campaign draft/submit and track preferences
- admin list filters by `application_type`, `campaign_id`, `track_id`

### Phase 5. Application stage v2

- create `application_stage`
- backfill from existing `job_posting_step`
- migrate `interview` to `application_stage_id`
- admin interview flow reads runtime stage snapshot

## 11. Deployment Sequence

```text
Deploy A: additive tables only
   |
   v
Backfill candidate accounts
   |
   v
Deploy B: candidate auth APIs + hidden UI
   |
   v
Enable CANDIDATE_AUTH_REQUIRED_FOR_WRITE
   |
   v
Deploy C: /jobs search UI + API
   |
   v
Deploy D: campaign tables + UI hidden behind CAMPAIGN_APPLICATIONS
   |
   v
Deploy E: application_stage migration + admin switch
```

### Feature flags

- `candidateAuthEnabled`
- `candidateWriteRequiresAuth`
- `publicJobSearchV2`
- `campaignApplicationsEnabled`
- `applicationStageV2`

## 12. Rollback Flowchart

```text
Is the failure in additive read path only?
  |
  +-- yes --> disable feature flag --> keep new tables --> investigate
  |
  +-- no --> is data already written to new ownership tables?
              |
              +-- no --> rollback app deploy
              |
              +-- yes --> keep schema, disable writes, run repair script, do not drop columns
```

Rule:

- schema rollback is not the primary rollback tool
- app rollback + flag disable is the primary rollback tool

## 13. Failure Modes

| Code path | Realistic failure | Test required | Error handling required | Silent if unhandled? | Critical gap? |
|---|---|---|---|---|---|
| Candidate OTP issue | mail provider timeout | yes | yes | yes | yes |
| Candidate OTP verify | replayed/expired code | yes | yes | no | no |
| Candidate session lookup | stale cookie after logout | yes | yes | yes | yes |
| Public search | slow query from missing GIN index | yes | yes | yes | yes |
| Evergreen submit | duplicate submit race | yes | yes | yes | yes |
| Campaign submit | track preference save partial failure | yes | yes | yes | yes |
| Attachment upload | session owner mismatch | yes | yes | yes | yes |
| Attachment download | attachment belongs to another candidate | yes | yes | yes | yes |
| Legacy claim | multiple historical rows share malformed email | yes | yes | yes | yes |
| Application stage materialization | template edits during submit | yes | yes | yes | yes |

Critical-gap rule:

- test missing
- error handling missing
- user-visible failure unclear

위 3개가 동시에 만족하면 release blocker다.

## 14. Observability

Metrics:

- `candidate_auth_otp_requested_total`
- `candidate_auth_otp_verified_total`
- `candidate_auth_otp_failed_total`
- `candidate_auth_rate_limited_total`
- `public_job_search_requests_total`
- `public_job_search_latency_ms`
- `public_job_search_zero_result_total`
- `application_draft_saved_total`
- `application_submit_total`
- `application_submit_failed_total`
- `attachment_access_denied_total`
- `legacy_candidate_claim_total`

Structured logs:

- challenge id
- candidate id
- application id
- opportunity type
- search query hash
- result count
- feature flag state

Dashboards:

- Candidate auth funnel
- Search performance + zero-result rate
- Submit success/failure rate
- Attachment auth failures

Alerts:

- OTP verify failure spike
- search p95 latency threshold breach
- submit failure ratio > threshold
- ownership 403 spike

## 15. Code Quality Boundaries

### Reuse, do not rebuild

- admin token hashing pattern
- file storage service abstraction
- existing Spring controller/service/repository layering
- Next.js feature/app structure

### Delete or deprecate

- write routes that trust raw `applicantEmail`
- public `/login` as admin login surface
- attachment routes without candidate ownership checks

### Do not introduce

- generic "Opportunity" DB mega-table
- separate search service
- client-side search over full dataset
- opaque auth middleware magic without explicit session resolution

## 16. Files That Must Gain Inline ASCII Diagrams

Backend:

- `apps/api/src/main/java/com/viberec/api/candidate/auth/service/CandidateAuthService.java`
- `apps/api/src/main/java/com/viberec/api/recruitment/search/service/OpportunitySearchService.java`
- `apps/api/src/main/java/com/viberec/api/recruitment/application/service/ApplicationSubmissionService.java`
- `apps/api/src/main/java/com/viberec/api/recruitment/application/service/ApplicationStagePlanner.java`
- `apps/api/src/main/java/com/viberec/api/recruitment/application/domain/Application.java`

Frontend:

- `apps/web/src/app/jobs/page.tsx`
- `apps/web/src/app/tracks/[slug]/page.tsx`
- `apps/web/src/features/candidate/auth/*`
- `apps/web/src/features/recruitment/search/*`

Tests:

- candidate auth integration tests
- application migration/backfill tests
- ownership e2e tests

## 17. Test Review

### Existing evidence

- backend integration tests exist for application submit/draft: `apps/api/src/test/java/com/viberec/api/recruitment/RecruitmentMvpTests.java`
- backend integration tests exist for admin auth: `apps/api/src/test/java/com/viberec/api/admin/auth/AdminAuthTests.java`
- backend integration tests exist for interview admin flow: `apps/api/src/test/java/com/viberec/api/admin/interview/AdminInterviewTests.java`
- web package currently has no test script and no test dependencies: `apps/web/package.json`

### Coverage diagram

```text
CODE PATH COVERAGE
===========================
[+] Existing admin auth
    |- [TESTED] login/session/logout integration

[+] Existing evergreen application submit
    |- [TESTED] draft save
    |- [TESTED] final submit
    |- [TESTED] closed posting rejection

[ ] Candidate email OTP issue
    |- [GAP] issue challenge
    |- [GAP] rate limit
    |- [GAP] resend cooldown

[ ] Candidate OTP verify
    |- [GAP] expired challenge
    |- [GAP] replayed challenge
    |- [GAP] wrong code attempt counter

[ ] Candidate-owned application writes
    |- [GAP] draft create/update by session
    |- [GAP] duplicate submit race
    |- [GAP] legacy account claim

[ ] Public search
    |- [GAP] title + body FTS
    |- [GAP] facet filtering
    |- [GAP] stable pagination ordering
    |- [GAP] zero-result handling

[ ] Campaign application
    |- [GAP] single campaign application per candidate
    |- [GAP] track preference ordering
    |- [GAP] campaign closed rejection

[ ] Attachment ownership
    |- [GAP] upload allowed only to owner
    |- [GAP] download denied for non-owner
    |- [GAP] delete denied after submit

[ ] Admin expansion
    |- [GAP] applicationType filter
    |- [GAP] campaign filter
    |- [GAP] runtime stage rendering

USER FLOW COVERAGE
===========================
[ ] Candidate login -> draft save -> submit -> me/applications
[ ] Candidate opens existing legacy email and claims old applications
[ ] Search -> open job -> login bounce -> return to form
[ ] Search -> open campaign -> choose tracks -> submit
[ ] Admin filters campaign applications and reviews one applicant

COVERAGE SUMMARY
===========================
Current affected-area coverage: backend integration only, web/e2e effectively absent
Release target: full backend integration for new paths + Playwright e2e for critical user flows
```

### Required test suites

Backend unit/integration:

- `CandidateAuthServiceTests`
- `CandidateSessionTests`
- `OpportunitySearchServiceTests`
- `CampaignApplicationTests`
- `ApplicationOwnershipTests`
- `ApplicationStagePlannerTests`
- `LegacyCandidateBackfillTests`

Frontend/e2e:

- `candidate-auth.e2e.ts`
- `job-search.e2e.ts`
- `campaign-application.e2e.ts`
- `candidate-dashboard.e2e.ts`
- `attachment-ownership.e2e.ts`

Contract tests:

- search response schema
- candidate session cookie behavior
- admin applicant filters

## 18. QA Test Artifact

QA must verify these pages:

- `/auth/login`
- `/jobs`
- `/jobs/:slug`
- `/tracks/:slug`
- `/me/applications`
- `/admin/login`
- `/admin/applicants`

Critical interactions:

- OTP request/verify/expire/resend
- search query + filter + pagination
- login bounce back to intended application target
- draft save/update with session
- final submit lock
- attachment upload/download/delete ownership
- campaign preference ordering

## 19. Implementation Phases and Acceptance Criteria

### Phase 1: candidate auth and ownership

Done when:

- no public write API accepts anonymous requests
- no attachment API trusts raw applicant email
- `/admin/login` is live
- `/login` no longer points to admin auth
- legacy applications are claimable by OTP login

### Phase 2: search v2

Done when:

- `/jobs` supports query/filter/sort/pagination
- title + description search is indexed
- home is a search entry surface, not a full listing wall

### Phase 3: campaign domain

Done when:

- `/tracks/:slug` exists
- campaign application is candidate-session based
- admin can filter campaign applications

### Phase 4: runtime stage snapshot

Done when:

- interviews reference `application_stage`
- evergreen and campaign both render runtime stage timelines
- template edits do not mutate in-flight applicant histories

## 20. Opinionated Recommendation

Build in this exact order:

1. candidate auth + write ownership
2. admin login split
3. search v2
4. campaign domain
5. application stage snapshot

Do not start campaign UX before candidate ownership is in place.  
Do not start external search infra before PostgreSQL FTS is measured.  
Do not generic-ize the DB too early.

## 21. Completion Summary

- Step 0: Scope Challenge - scope accepted as end-state, sequencing changed
- Architecture Review: 6 major decisions locked
- Code Quality Review: reuse boundaries and delete boundaries written
- Test Review: diagram produced, major gaps identified
- Performance Review: PostgreSQL FTS chosen, external engine deferred
- NOT in scope: written
- What already exists: written
- TODOS.md updates: none; deferred items captured in NOT in scope
- Failure modes: critical gaps flagged
- Outside voice: pending / optional
- Lake Score: chose complete architecture, incremental rollout
