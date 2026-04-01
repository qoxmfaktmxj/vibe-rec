<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# src (web)

## Purpose

All Next.js application source code, organized by the feature-sliced design pattern with Next.js App Router conventions.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js App Router pages, layouts, API route handlers (see `app/AGENTS.md`) |
| `features/` | Feature components organized by domain (see `features/AGENTS.md`) |
| `shared/` | Shared API clients, auth utilities, common libs (see `shared/AGENTS.md`) |
| `entities/` | TypeScript type definitions matching API responses (see `entities/AGENTS.md`) |
| `components/` | Reusable UI primitives (shadcn-based) |
| `lib/` | General utilities (`utils.ts` — cn/clsx helper) |

## For AI Agents

### Working In This Directory

- **Feature-sliced architecture**: pages in `app/`, feature logic in `features/`, shared utilities in `shared/`, types in `entities/`
- Import order convention: `app/` imports from `features/`, `features/` imports from `shared/` and `entities/`, `shared/` and `entities/` are leaf layers
- `components/ui/` contains shadcn primitives — modify sparingly, prefer wrapping in feature components
- Global CSS variables are in `app/globals.css` — this is the single source of truth for design tokens

<!-- MANUAL: -->
