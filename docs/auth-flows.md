# Auth Flows

This file documents the current auth and ownership behavior on `main`.

## Route Split

### Candidate auth

- browser page: `/auth/login`
- compatibility redirect: `/login`
- workspace: `/me`
- API family: `/api/candidate/auth/*`

### Admin auth

- browser page: `/admin/login`
- protected workspace: `/admin`
- API family: `/api/admin/auth/*`

These route families are intentionally separate.

## Candidate Flow

### Signup

Request:
- `POST /api/candidate/auth/signup`

Expected payload:

```json
{
  "name": "Candidate Name",
  "email": "candidate@example.com",
  "phone": "010-1234-5678",
  "password": "Password123!"
}
```

Response:
- authenticated candidate session payload
- session token is stored by the web BFF as an HTTP-only cookie

### Login

Request:
- `POST /api/candidate/auth/login`

Expected payload:

```json
{
  "email": "candidate@example.com",
  "password": "Password123!"
}
```

### Session

- browser session lookup goes through the web BFF
- API lookup uses `X-Candidate-Session`

### Logout

- `POST /api/candidate/auth/logout`

## Candidate-Owned Application Rules

### Draft and submit

Candidate application writes require a valid candidate session:
- `POST /api/job-postings/{id}/application-draft`
- `POST /api/job-postings/{id}/application-submit`

The request body no longer acts as the identity source of truth.

The backend derives:
- applicant name
- applicant email
- applicant phone

from the authenticated candidate account and snapshots them into the application record.

### Attachments

Candidate-owned attachment routes:
- `POST /api/job-postings/{jobPostingId}/application-draft/attachments`
- `POST /api/applications/{applicationId}/attachments`
- `GET /api/applications/{applicationId}/attachments`
- `DELETE /api/attachments/{attachmentId}`
- `GET /api/attachments/{attachmentId}/download`

These routes also require a valid candidate session.

## Admin Flow

### Signup

Request:
- `POST /api/admin/auth/signup`

Expected payload:

```json
{
  "username": "recruit-ops",
  "displayName": "Recruit Ops",
  "password": "Password123!"
}
```

### Login

Request:
- `POST /api/admin/auth/login`

Expected payload:

```json
{
  "username": "recruit-ops",
  "password": "Password123!"
}
```

### Session

- protected admin pages rely on the web app reading the admin session cookie
- API calls use `X-Admin-Session`

### Logout

- `POST /api/admin/auth/logout`

## Admin Authorization Surface

Admin auth is not just session presence. Some endpoints are permission-gated in the API.

Examples:
- applicant view
- applicant review
- interview manage
- evaluation write
- final decision
- notification send

The permission checks are enforced in Spring and should not be documented as frontend-only behavior.

## Local Dev Admin Account

The API supports a development bootstrap admin account through configuration.

Relevant settings:
- `APP_ADMIN_DEV_ACCOUNT_ENABLED`
- `APP_ADMIN_DEV_ACCOUNT_USERNAME`
- `APP_ADMIN_DEV_ACCOUNT_PASSWORD`
- `APP_ADMIN_DEV_ACCOUNT_DISPLAY_NAME`
- `APP_ADMIN_DEV_ACCOUNT_ROLE`

The checked-in default in `application.yml` keeps the dev account disabled unless explicitly enabled by configuration.
