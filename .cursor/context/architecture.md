# Project Architecture — spice-me

> Keep this file updated as the project evolves. Agents read this first to orient themselves.

## Overview
<!-- 2-3 sentences about what this product is and does. -->
spice-me is a monorepo full-stack web application.

## Monorepo Layout
```
spice-me/
  apps/
    api/   — NestJS REST API          (port 3001)
    web/   — Next.js 16 frontend      (port 3003)
  packages/
    ui/                — @repo/ui       shared React components + styles
    tailwind-config/   — @repo/tailwind-config
    typescript-config/ — @repo/typescript-config (base / nextjs / react-library)
    eslint-config/     — @repo/eslint-config
```

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Language | TypeScript (strict) |
| Frontend | Next.js 16, React 19, App Router |
| Styling | TailwindCSS v4, @repo/tailwind-config |
| Backend | NestJS (modular) |
| ORM | Prisma |
| Database | PostgreSQL |
| Package manager | Bun |
| Monorepo orchestration | Turborepo |

## Feature Index
<!-- Add a row for every feature as it is built. Link to the context file. -->
| Feature | Status | Context File |
|---------|--------|-------------|
| i18n (`en`, `no`, prefix routes) | complete | [.cursor/context/features/i18n.md](features/i18n.md) |
| Backend setup (Swagger, Prisma, config, validation) | complete | [.cursor/context/features/backend-setup.md](features/backend-setup.md) |

## Shared Conventions
- Bun for all installs; `bun add <pkg> --filter <workspace>`
- All tasks run through Turborepo: `bun turbo dev`, `bun turbo build`
- Shared code → `packages/`; app-specific code stays in `apps/`
- TypeScript config extends `@repo/typescript-config`
- ESLint config extends `@repo/eslint-config`

## Key Cross-Cutting Concerns
<!-- Document things that affect every feature: auth, error handling, logging, etc. -->

### Authentication
<!-- Describe the auth strategy once it is implemented. -->
_Not yet implemented._

### Error Handling
- NestJS: throw built-in HTTP exceptions (`NotFoundException`, etc.) in services
- Next.js: use `error.tsx` segments; surface user-facing messages only

### Environment Variables
| Variable | Used by | Purpose |
|----------|---------|---------|
| `PORT` | api | NestJS listen port (fallback 3001) |
| `DATABASE_URL` | api | PostgreSQL connection string |
| `NEXT_PUBLIC_API_URL` | web | Base URL for NestJS API calls |
