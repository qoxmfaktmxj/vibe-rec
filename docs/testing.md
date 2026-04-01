# Testing

This project currently validates `main` with backend integration tests, frontend lint/build, and optional browser-based flow checks.

## Backend

Run all backend tests:

```powershell
cd apps/api
.\gradlew.bat test --console=plain
```

Current scope includes:
- admin auth
- candidate auth
- authenticated application authorization
- recruitment MVP flow
- applicant review behavior
- hiring decision behavior
- interview behavior

The backend test style is Spring integration testing around the real application context.

## Frontend

Lint:

```powershell
cd apps/web
npm run lint
```

Build:

```powershell
cd apps/web
npm run build
```

These are the checks currently enforced in CI.

## CI

GitHub Actions workflow:
- backend test job
- frontend lint job
- frontend build job

Workflow file:
- [`../.github/workflows/ci.yml`](../.github/workflows/ci.yml)

## Browser Validation

Browser validation is still pragmatic rather than fully productized.

Recent local flow checks covered:
- admin signup and login
- candidate signup and login
- authenticated draft save
- attachment ownership flow
- final application submit
- admin applicant lookup

Artifacts are written under:
- `output/playwright`
- `output/runtime/browser-check`

Those outputs are evidence of local verification, not stable documentation.

## Current Expectation Before Merging

Minimum verification for changes touching the product path:
- `apps/api` tests pass
- `apps/web` lint passes
- `apps/web` build passes

Add a browser flow check when changes affect:
- auth
- application submission
- attachments
- protected admin routing

## Known Gaps

The repository does not yet have a fully standardized permanent browser E2E suite in source control for every flow. Browser validation still exists partly as local verification output and temporary specs.
