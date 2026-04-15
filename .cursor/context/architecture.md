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
| Auth & user management (JWT, roles, users API) | complete | [.cursor/context/features/auth-user-management.md](features/auth-user-management.md) |
| Frontend auth (NextAuth, modals, API client, admin shell) | complete | [.cursor/context/features/frontend-auth.md](features/frontend-auth.md) |
| Restaurant module (default restaurant, assignments, UTC hours) | complete | [.cursor/context/features/restaurant-module.md](features/restaurant-module.md) |
| Restaurant module (admin UI: restaurants, assignments, restaurant admins) | complete | [.cursor/context/features/frontend-restaurant-module.md](features/frontend-restaurant-module.md) |
| Backend product management (categories, products, variants, allergies, restaurant products) | complete | [.cursor/context/features/backend-product-management.md](features/backend-product-management.md) |
| Frontend product management (catalog, categories, subcategories, allergy items, restaurant products) | complete | [.cursor/context/features/frontend-product-management.md](features/frontend-product-management.md) |
| Public menu browse (categories, subcategories, product grid) | complete | [.cursor/context/features/frontend-menu.md](features/frontend-menu.md) |
| Home hero (fire animation, menu CTA) | complete | [.cursor/context/features/frontend-home-hero.md](features/frontend-home-hero.md) |
| Restaurant tables & reservations (API + admin + customer reserve) | complete | [.cursor/context/features/table-reservations.md](features/table-reservations.md) |

## Shared Conventions
- Bun for all installs; `bun add <pkg> --filter <workspace>`
- All tasks run through Turborepo: `bun turbo dev`, `bun turbo build`
- Shared code → `packages/` (config, no shared React UI package); app-specific code stays in `apps/` (UI primitives: `apps/web/components/ui`)
- TypeScript config extends `@repo/typescript-config`
- ESLint config extends `@repo/eslint-config`

## Key Cross-Cutting Concerns
<!-- Document things that affect every feature: auth, error handling, logging, etc. -->

### Authentication
- **API:** JWT access token (Bearer, 15m) + refresh token (body field, 7d), bcrypt password hashing, refresh token stored hashed in DB. Roles: `ADMIN`, `USER`, `RESTAURANT_ADMIN`. See [auth-user-management.md](features/auth-user-management.md) and [restaurant-module.md](features/restaurant-module.md).
- **Web:** NextAuth + JWT session, `@modal` auth routes, `lib/api-client` with refresh — see [frontend-auth.md](features/frontend-auth.md).

### Error Handling
- NestJS: throw built-in HTTP exceptions (`NotFoundException`, etc.) in services
- Next.js: use `error.tsx` segments; surface user-facing messages only

### Environment Variables
| Variable | Used by | Purpose |
|----------|---------|---------|
| `PORT` | api | NestJS listen port (fallback 3001) |
| `DATABASE_URL` | api | PostgreSQL connection string |
| `JWT_SECRET` | api | Signs access JWTs |
| `JWT_REFRESH_SECRET` | api | Signs refresh JWTs (must differ from `JWT_SECRET`) |
| `NEXT_PUBLIC_API_URL` | web | Base URL for NestJS API calls |
