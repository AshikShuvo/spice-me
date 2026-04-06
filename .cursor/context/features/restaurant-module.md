# Feature: Restaurant module (API)

## Summary

NestJS module for restaurants: unique name, auto-generated code (`RQ0001`–`RQ1000`), address, coordinates, IANA `timezone`, `openingTime` / `closingTime` as UTC `HH:MM` strings, `isActive`, and a single **default** restaurant for guest/menu flows. `RESTAURANT_ADMIN` users are assigned to one or more restaurants via `RestaurantAdminAssignment`. Admins manage restaurants and assignments; restaurant admins only read restaurants they are assigned to.

## Status

**complete** — API only; menu/orders integration is future work.

## Scope

- **App(s):** `apps/api`
- **Entry point:** `apps/api/src/restaurants/restaurants.controller.ts`

## Key files

| File | Role |
|------|------|
| `apps/api/prisma/schema.prisma` | `Restaurant`, `RestaurantAdminAssignment`, `Role.RESTAURANT_ADMIN` |
| `apps/api/src/restaurants/restaurants.module.ts` | Module registration |
| `apps/api/src/restaurants/restaurants.service.ts` | CRUD, code generation, default flag, assignments |
| `apps/api/src/restaurants/restaurants.controller.ts` | HTTP routes (order-sensitive static paths) |
| `apps/api/src/restaurants/dto/*.ts` | Validation DTOs |
| `apps/api/src/users/users.service.ts` | `createRestaurantAdmin`, `softDelete` cascades assignments |
| `apps/api/src/users/users.controller.ts` | `POST /users/restaurant-admin` |
| `apps/api/src/restaurants/restaurants.service.spec.ts` | Unit tests |
| `apps/api/test/restaurants.e2e-spec.ts` | E2E (upserts default admin in `beforeAll` if DB unseeded) |
| `apps/api/eslint.config.mjs` | Relaxed unsafe-* rules for `src/restaurants/**/*.ts` (Prisma + type-checked ESLint) |

## Data model

```prisma
enum Role {
  ADMIN
  USER
  RESTAURANT_ADMIN
}

model Restaurant {
  id          String   @id @default(cuid())
  name        String   @unique
  code        String   @unique   // RQ + 4 digits
  address     String
  latitude    Float
  longitude   Float
  timezone    String              // IANA, e.g. Europe/Oslo
  openingTime String              // HH:MM UTC
  closingTime String              // HH:MM UTC
  isActive    Boolean  @default(true)
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  adminAssignments RestaurantAdminAssignment[]
}

model RestaurantAdminAssignment {
  id           String   @id @default(cuid())
  restaurantId String
  userId       String
  assignedAt   DateTime @default(now())
  restaurant   Restaurant @relation(..., onDelete: Cascade)
  user         User       @relation(..., onDelete: Cascade)
  @@unique([restaurantId, userId])
}
```

**Restaurant code:** Next code = max existing numeric suffix + 1; `RQ` + `padStart(4,'0')`; throws `400` if next &gt; 1000.

**Default restaurant:** `setDefault` runs in one `prisma.$transaction`: `updateMany({ isDefault: false })` then `update` target `isDefault: true`. `GET /restaurants/default` requires `isDefault: true` **and** `isActive: true`.

## API contract

Base URL: no global prefix (e.g. `http://localhost:3001/restaurants`).

### Public

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/restaurants/default` | Active default restaurant; **404** if none |

### Authenticated (JWT)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/restaurants/my` | `RESTAURANT_ADMIN` | Assigned restaurants |
| `GET` | `/restaurants/:id` | any logged-in | `ADMIN`: any; `RESTAURANT_ADMIN`: only if assigned; `USER`: **403** |
| `POST` | `/restaurants` | `ADMIN` | Create (201); **409** if `name` duplicates unique constraint |
| `GET` | `/restaurants` | `ADMIN` | Paginated list (`page`, `limit`) |
| `GET` | `/restaurants/:id/admins` | `ADMIN` | List assignments + `UserProfile` (no password / refreshToken) |
| `PATCH` | `/restaurants/:id` | `ADMIN` | Partial update (not `code` / `id`); **409** if new `name` duplicates another row |
| `PATCH` | `/restaurants/:id/status` | `ADMIN` | `{ isActive: boolean }` |
| `PATCH` | `/restaurants/:id/default` | `ADMIN` | Set as sole default |
| `POST` | `/restaurants/:id/admins` | `ADMIN` | `{ userId }` — user must be `RESTAURANT_ADMIN` (201) |
| `DELETE` | `/restaurants/:id/admins/:userId` | `ADMIN` | Remove assignment only |

### Users (related)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `POST` | `/users/restaurant-admin` | `ADMIN` | Create user with `RESTAURANT_ADMIN` (201); same password rules as admin |

## Route order (NestJS)

Declare **`GET` `default`**, **`GET` `my`**, **`GET` `:id/admins`** before **`GET` `:id`**. Similarly **`PATCH` `:id/status`** and **`PATCH` `:id/default`** before **`PATCH` `:id`**.

## Time & timezone

- API stores and returns `openingTime` / `closingTime` as **`HH:MM` UTC** strings.
- `timezone` is metadata for clients (display / conversion); the API does not interpret local wall-clock from it.

## Dependencies on other features

- Auth JWT + `RolesGuard`; see [auth-user-management.md](auth-user-management.md).
- PostgreSQL + migrations applied.
- Admin UI for this module: [frontend-restaurant-module.md](frontend-restaurant-module.md).

## Gotchas

- Prisma **P2002** on `name` (and `code`) is mapped to **`409 Conflict`** with a clear message in `RestaurantsService` (`create` / `update`), including pg-adapter `meta.driverAdapterError` shapes.
- Concurrent creates can race on code generation (acceptable for current scale).
- `softDelete` on a `RESTAURANT_ADMIN` removes all `RestaurantAdminAssignment` rows in the same `$transaction` as deactivating the user.
- E2E file upserts `admin@spiceme.com` so login works when the DB was never seeded.
- After `prisma migrate` / schema changes, run **`bunx prisma generate`** so `Role` enum and client match the schema (otherwise ESLint/TS may break on `RESTAURANT_ADMIN`).
