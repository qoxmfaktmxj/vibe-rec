# Local Development

## Prerequisites

- Java 21
- Node.js 22 or compatible recent Node runtime
- npm
- Docker Desktop or Docker Engine with Compose

## Services

### PostgreSQL

Start local PostgreSQL:

```powershell
cd infra/docker
docker compose up -d
```

Default values:
- host: `127.0.0.1`
- port: `5435`
- database: `vibe_rec`
- username: `vibe_rec`
- password: `vibe_rec`

## API

### Run on default port

```powershell
cd apps/api
.\mvnw.cmd spring-boot:run
```

Default API base:
- `http://127.0.0.1:8080/api`

### Run on port 8083

This matches the checked-in web local config.

```powershell
cd apps/api
$env:SERVER_PORT="8083"
.\mvnw.cmd spring-boot:run
```

### Useful API endpoints

- `GET http://127.0.0.1:8083/api/ping`
- `GET http://127.0.0.1:8083/api/job-postings`
- `GET http://127.0.0.1:8083/api/actuator/health`

## Web

Install and run:

```powershell
cd apps/web
npm install
npm run dev
```

Default web URL:
- `http://127.0.0.1:3000`

The checked-in `.env.local` points the web app to:

```env
API_BASE_URL=http://127.0.0.1:8083/api
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8083/api
```

If you change the API port, update `apps/web/.env.local` to match.

## Recommended Manual Smoke Flow

### Candidate

1. Open `/job-postings`
2. Open a public posting detail page
3. Confirm anonymous users are gated before application write actions
4. Sign up or log in at `/auth/login`
5. Return to the posting
6. Save a draft
7. Upload an attachment
8. Submit the application

### Admin

1. Open `/admin/login`
2. Sign up or log in
3. Open `/admin`
4. Open `/admin/applicants`
5. Filter by the candidate email you just used
6. Open applicant detail and continue review actions as needed

## Output and Runtime Artifacts

Local verification output may be written under:
- `output/logs`
- `output/playwright`
- `output/runtime`

These directories are runtime artifacts, not source-of-truth documentation.
