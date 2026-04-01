# Feature: Backend initial setup

## Summary

Initial NestJS `apps/api` foundation: Swagger at `/api/docs`, Nest `Logger`, global `ValidationPipe` (class-validator / class-transformer), Prisma 7 with PostgreSQL driver adapter, and `@nestjs/config` for environment loading. Turborepo `build` / `dev` tasks declare `PORT`, `DATABASE_URL`, and `NODE_ENV` for cache-aware env handling.

## Status

status: complete

## Scope

- **App(s):** api
- **Entry points:**
  - `apps/api/src/main.ts` — bootstrap, Swagger, validation, logging
  - `apps/api/src/app.module.ts` — `ConfigModule`, `PrismaModule`
  - `apps/api/src/prisma/prisma.service.ts` — PrismaClient lifecycle

## Key Files

| File | Role |
|------|------|
| `apps/api/src/main.ts` | Logger, global `ValidationPipe`, Swagger UI path `api/docs` |
| `apps/api/src/app.module.ts` | `ConfigModule.forRoot({ isGlobal: true })`, `PrismaModule` |
| `apps/api/src/prisma/prisma.module.ts` | Global Prisma module |
| `apps/api/src/prisma/prisma.service.ts` | Extends `PrismaClient`, `@prisma/adapter-pg` + `DATABASE_URL` |
| `apps/api/prisma/schema.prisma` | Prisma schema (datasource provider only; URL in `prisma.config.ts`) |
| `apps/api/prisma.config.ts` | Prisma 7 config: schema path, migrations path, `DATABASE_URL` |
| `apps/api/.env.example` | Documented env vars (copy to `.env`) |
| `turbo.json` | `env` on `build` and `dev` for Turborepo |

## API Contract

### REST (NestJS)

```
GET /
  Returns: Hello string (starter)

GET /api/docs
  Swagger UI (OpenAPI)
```

## Data Model

_No models yet._ Add models in `apps/api/prisma/schema.prisma`, then run `bun run db:generate` (or `bun run build` which runs `prisma generate` first).

```prisma
datasource db {
  provider = "postgresql"
}
```

## State & Data Flow

```
HTTP → Controller → Service → PrismaService → PostgreSQL (via adapter-pg)
```

Config: `ConfigModule` reads `apps/api/.env` / `.env.local` (see `envFilePath` in `app.module.ts`).

## Environment Variables

| Variable | Where set | Purpose |
|----------|-----------|---------|
| `PORT` | `apps/api/.env` | Nest listen port (fallback `3001`) |
| `DATABASE_URL` | `apps/api/.env` | PostgreSQL URL for Prisma CLI and runtime |
| `NODE_ENV` | `apps/api/.env` | Node environment |

**Monorepo / Turborepo:** Prefer per-app `.env` under `apps/api`. For shared secrets across apps, you can add a root `.env` and load it via tooling or duplicate keys in each app — Turborepo tracks listed `env` keys on tasks for cache invalidation. `turbo.json` includes `PORT`, `DATABASE_URL`, `NODE_ENV` on `build` and `dev`.

## Dependencies on Other Features

- PostgreSQL reachable at `DATABASE_URL` for runtime DB calls (migrations: `bunx prisma migrate dev` from `apps/api`).

## Key Decisions & Gotchas

- **Prisma 7:** Uses `prisma-client` generator with `output = "../generated/prisma"`. Client is imported from `../../generated/prisma/client` in `PrismaService`. Run `prisma generate` before/ as part of `build` (`package.json` `build` script).
- **Driver adapter:** `PrismaClient` requires `@prisma/adapter-pg` and `pg` in ORM 7 for PostgreSQL.
- **Bun workspace installs:** Avoid `bun add --filter api` — it can conflict with the npm package name `api`. Install from `apps/api` with `bun add <pkg>` or use `--filter ./apps/api` if supported.
- **Validation:** Global pipe uses `whitelist`, `forbidNonWhitelisted`, `transform`, and `enableImplicitConversion` (aligns with `.cursor/rules/nestjs-standards.mdc`).
- **ESM project (`"type": "module"`):** `apps/api/package.json` is `"type": "module"`. All relative TypeScript imports use `.js` extensions (required by `nodenext`). This was necessary because Prisma 7's generated client uses `import.meta.url`, which Node.js 22.13 routes through `loadESMFromCJS` when compiled as CJS, causing `exports is not defined` at runtime.
- **E2E / Jest ESM:** Tests run with `NODE_OPTIONS=--experimental-vm-modules`. `ts-jest` is configured with `useESM: true`. A two-entry `moduleNameMapper` handles both the Prisma client mock (intercepted before) and the general `.js` → no-extension strip so Jest resolves `.ts` source files.

## TODOs / Open Questions

- [ ] Add first domain models and migrations when features require persistence.
