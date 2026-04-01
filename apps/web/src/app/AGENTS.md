<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# app

## Purpose

Next.js App Router directory containing all pages, layouts, loading states, error boundaries, and API route handlers (BFF endpoints).

## Key Files

| File | Description |
|------|-------------|
| `layout.tsx` | Root layout — Sora + IBM Plex Mono fonts, `<html lang="ko">` |
| `globals.css` | Design tokens (CSS variables), Tailwind config, custom utilities |
| `page.tsx` | Homepage — hero section + featured job postings |
| `icon.svg` | Favicon — primary blue background with white "H" |
| `error.tsx` | Global error boundary |
| `not-found.tsx` | 404 page |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `job-postings/` | Public job listing page, detail page, and application wizard |
| `auth/` | Candidate login page (`/auth/login`) |
| `login/` | Login redirect page |
| `me/` | Candidate dashboard — profile, application history |
| `profile/` | Candidate profile editor page |
| `admin/` | Admin workspace — login, applicant management, job posting CRUD |
| `api/` | BFF route handlers — proxy requests to Spring API with session cookies |

## For AI Agents

### Working In This Directory

- Every public page must use `PublicSiteHeader` from `features/recruitment/layout/`
- Admin pages live under `admin/(protected)/` route group with shared layout + auth guard
- `loading.tsx` files provide skeleton UI during server component data fetching
- Route handlers in `api/` follow the BFF pattern: read cookie → forward to Spring API → return response
- `globals.css` is the **only** place to define new design tokens

### Route Structure

**Public:**
- `/` — Homepage with hero + featured postings
- `/job-postings` — Searchable job posting browser
- `/job-postings/[id]` — Job posting detail
- `/job-postings/[id]/apply` — Application wizard (requires candidate auth)

**Candidate:**
- `/auth/login` — Candidate signup/login
- `/me` — Candidate dashboard with application status
- `/me/applications/[applicationId]` — Submitted application read-only view
- `/profile` — Profile editor

**Admin:**
- `/admin/login` — Admin login
- `/admin` — Admin dashboard
- `/admin/applicants` — Paginated applicant list with filters
- `/admin/applicants/[id]` — Applicant detail with review, interviews, hiring
- `/admin/job-postings/[id]` — Job posting editor
- `/admin/job-postings/[id]/questions` — Custom question editor
- `/admin/job-postings/new` — Create new job posting

<!-- MANUAL: -->
