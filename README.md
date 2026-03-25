# vibe-rec

`vibe-rec` is a recruitment platform rebuilt on `Next.js 16`, `Spring Boot 4`, and `PostgreSQL 16`.

The current `main` branch ships:
- public job posting browse and detail pages
- candidate signup, login, session, and logout
- authenticated application draft and final submit
- candidate-owned attachment upload, list, download, and delete
- admin signup, login, session, and logout
- admin applicant review, interview, evaluation, final decision, and notification flows

The repository no longer uses the old anonymous applicant email flow as the source of truth. Candidate-owned application mutations are now session-backed.

## Current Surface

### Web routes

- `/`
  - public home
- `/job-postings`
  - public job posting list
- `/job-postings/[id]`
  - public job posting detail
  - candidate-only application form
- `/auth/login`
  - candidate login and signup
- `/login`
  - compatibility redirect to `/auth/login`
- `/me`
  - candidate workspace summary
- `/admin/login`
  - admin login and signup
- `/admin`
  - protected admin dashboard
- `/admin/applicants`
  - applicant list
- `/admin/applicants/[id]`
  - applicant detail and downstream admin actions

### API base path

The Spring API is mounted at `/api`, not `/api/v1`.

Key endpoints:
- `GET /api/ping`
- `GET /api/job-postings`
- `GET /api/job-postings/{id}`
- `POST /api/job-postings/{id}/application-draft`
- `POST /api/job-postings/{id}/application-submit`
- `POST /api/job-postings/{jobPostingId}/application-draft/attachments`
- `POST /api/applications/{applicationId}/attachments`
- `GET /api/applications/{applicationId}/attachments`
- `DELETE /api/attachments/{attachmentId}`
- `GET /api/attachments/{attachmentId}/download`
- `POST /api/candidate/auth/signup`
- `POST /api/candidate/auth/login`
- `GET /api/candidate/auth/session`
- `POST /api/candidate/auth/logout`
- `POST /api/admin/auth/signup`
- `POST /api/admin/auth/login`
- `GET /api/admin/auth/session`
- `POST /api/admin/auth/logout`
- `GET /api/admin/applicants`
- `GET /api/admin/applicants/{id}`
- `PATCH /api/admin/applicants/{id}/review-status`
- `POST /api/admin/applicants/{id}/interviews`
- `GET /api/admin/applicants/{id}/interviews`
- `POST /api/admin/applicants/{id}/final-decision`
- `POST /api/admin/applicants/{id}/notifications`
- `GET /api/admin/applicants/{id}/notifications`
- `GET /api/admin/applicants/{applicationId}/attachments`
- `PATCH /api/admin/interviews/{id}`
- `POST /api/admin/interviews/{id}/evaluations`
- `GET /api/admin/job-postings/{id}/steps`
- `GET /api/admin/attachments/{attachmentId}/download`
- `GET /api/admin/migration/runs`
- `GET /api/admin/migration/mappings?entityType={entityType}`

See [docs/architecture.md](docs/architecture.md) and [docs/auth-flows.md](docs/auth-flows.md) for the current system model.

## Stack

### Web

- Next.js 16 App Router
- React 19
- TypeScript 5
- Tailwind CSS 4

### API

- Java 21
- Spring Boot 4
- Spring Web MVC
- Spring Data JPA
- Flyway

### Database

- PostgreSQL 16
- additive Flyway migrations under `apps/api/src/main/resources/db/migration`

## Repository Layout

```text
vibe-rec/
  apps/
    api/    Spring Boot API
    web/    Next.js app and BFF routes
  docs/     current-state documentation
  infra/
    docker/   local PostgreSQL compose
    postgres/ local DB data and init scripts
  output/   runtime artifacts and local verification output
```

## Local Development

### 1. Start PostgreSQL

```powershell
cd infra/docker
docker compose up -d
```

Default local database:
- host: `127.0.0.1`
- port: `5435`
- database: `vibe_rec`
- username: `vibe_rec`
- password: `vibe_rec`

### 2. Run the API

```powershell
cd apps/api
.\mvnw.cmd spring-boot:run
```

The API defaults to `http://127.0.0.1:8080/api`.

If you want to match the checked-in web `.env.local`, run:

```powershell
cd apps/api
$env:SERVER_PORT="8083"
.\mvnw.cmd spring-boot:run
```

### 3. Run the web app

```powershell
cd apps/web
npm install
npm run dev
```

The checked-in local web config points to:

```env
API_BASE_URL=http://127.0.0.1:8083/api
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8083/api
```

More detail: [docs/local-development.md](docs/local-development.md)

## Verification

### Backend

```powershell
cd apps/api
.\mvnw.cmd test
```

### Frontend lint

```powershell
cd apps/web
npm run lint
```

### Frontend build

```powershell
cd apps/web
npm run build
```

### CI

GitHub Actions runs:
- backend tests
- frontend lint
- frontend build

See [docs/testing.md](docs/testing.md) for the current verification matrix.

## Developer Notes

- `main` is now the active working branch.
- Candidate application writes require a valid candidate session.
- Admin pages are split from candidate auth:
  - admin: `/admin/login`
  - candidate: `/auth/login`
- `apps/web/src/app/api/**` route handlers act as the browser-facing BFF layer.
- historical planning documents were intentionally removed; `docs/` now documents only the current implementation.
