<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# web

## Purpose

Next.js 16 App Router frontend serving the public recruitment site (job listings, candidate applications) and the admin workspace (applicant management, interviews, hiring decisions). Acts as a BFF (Backend for Frontend) layer that proxies authenticated requests to the Spring Boot API.

## Key Files

| File | Description |
|------|-------------|
| `package.json` | Dependencies and scripts |
| `next.config.ts` | Next.js configuration |
| `postcss.config.mjs` | PostCSS/Tailwind setup |
| `eslint.config.mjs` | ESLint configuration |
| `tsconfig.json` | TypeScript configuration |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `src/` | All source code (see `src/AGENTS.md`) |
| `public/` | Static assets (SVG icons) |

## For AI Agents

### Working In This Directory

- Read `DESIGN.md` (project root) before any UI work
- Use design tokens from `src/app/globals.css` — never hardcode colors
- Fonts: Sora (headline + body), IBM Plex Mono (metadata) — see `src/app/layout.tsx`
- The app uses a BFF pattern: browser -> Next.js route handlers -> Spring API
- Session cookies are HTTP-only, managed in `src/shared/lib/session-cookie.ts`
- Admin routes live under `src/app/admin/(protected)/` route group
- Public candidate routes: `/`, `/job-postings`, `/auth/login`, `/me`

### Testing Requirements

No automated web test suite currently. Manual testing against a running API instance.

### Common Patterns

- **Feature-sliced structure**: `features/{domain}/{feature}/Component.tsx`
- **BFF route handlers**: `src/app/api/{domain}/route.ts` — read cookie, forward to API
- **Shared API clients**: `src/shared/api/*.ts` — typed fetch wrappers for the Spring API
- **Entity models**: `src/entities/{domain}/model.ts` — TypeScript types matching API responses
- **Status utilities**: `src/shared/lib/recruitment.ts` — badge colors, status labels

## Dependencies

### Internal

- Spring Boot API (`apps/api`) — all data and business logic

### External

- Next.js 16 — Framework
- React — UI library
- Tailwind CSS — Styling
- Sora, IBM Plex Mono — Google Fonts

<!-- MANUAL: -->
