# Recruitment Legacy Modernization Plan

## Goal

- Keep the legacy system analyzable while rebuilding the target system in a new workspace.
- Standardize on `Next.js + Spring Boot + PostgreSQL`.
- Move by vertical slices instead of a big-bang rewrite.
- Preserve raw recruitment payloads in PostgreSQL `jsonb` while normalizing the fields that matter for search and workflow.

## Target Stack

### Frontend

- Next.js App Router
- TypeScript
- shadcn/ui
- Tailwind CSS
- React Hook Form
- Zod
- TanStack Query
- Grid adapter layer

### Backend

- Java 21
- Spring Boot
- Spring Web MVC
- Spring Validation
- Spring Data JPA
- Flyway
- Testcontainers

### Database

- PostgreSQL
- `jsonb` for raw applicant payload preservation
- single target schema instead of the legacy `rec_*` / `rem_*` split

## Current Progress

### Done

- Phase 0 foundation bootstrap
- PostgreSQL local compose
- Spring Boot API bootstrap and Flyway baseline
- Next.js web bootstrap
- job posting list and detail read side
- application draft save
- final submit endpoint and submit lock rule
- development admin bootstrap account
- persisted admin session and protected `/admin` shell
- recruiter applicant list and detail
- recruiter review status update flow

### Partial

- README and roadmap status board
- applicant submission is implemented for draft and final submit, but file upload is not built yet
- recruiter shell and the first applicant management slice are built, but deeper operations are not

### Next

1. file upload and normalized resume expansion
2. role split and tighter admin account policies
3. interview and evaluation workflows
4. Testcontainers and Playwright automation in CI

## Phase Plan

### Phase 0. Foundation

- workspace bootstrap
- local PostgreSQL
- API and web startup verification

Status: done

### Phase 1. Schema Baseline

- target schema definition
- legacy-to-new mapping
- ERD and migration notes

Status: partial

### Phase 2. Auth and App Shell

- admin login
- session persistence
- protected admin shell

Status: done for MVP

### Phase 3. Job Posting Read Side

- list
- detail
- step read

Status: done for MVP

### Phase 4. Applicant Submission

- draft save
- final submit
- submit lock
- file upload

Status: partial

### Phase 5. Recruiter Applicant Management

- applicant list
- applicant detail
- recruiter status updates

Status: MVP done, expansion pending

### Phase 6. Interview and Evaluation

- interview setup
- evaluator assignment
- scoring
- pass/fail aggregation

Status: not started

### Phase 7. Hiring Decision and Notice

- final decision
- notice campaign
- follow-up tasks

Status: not started

### Phase 8. Migration and Cutover

- data migration
- parity verification
- cutover and rollback plan

Status: not started
