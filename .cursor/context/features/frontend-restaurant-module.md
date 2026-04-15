# Feature: Restaurant module (frontend admin)

## Summary

Next.js admin UI: **`ADMIN`** — full CRUD for restaurants and restaurant-admin users (UTC hours, IANA timezone, geo), assignments, soft-delete. **`RESTAURANT_ADMIN`** — same `/admin` shell and dashboard, but **no** Restaurants / Restaurant Admins nav links; `proxy.ts` blocks those URLs; sidebar **active restaurant** `Select` (assigned locations from `GET /restaurants/my`) with choice persisted in `localStorage` for future orders/stats. All HTTP calls go through a **service layer** with try/catch.

## Status

**complete**

## Scope

- **App(s):** `apps/web`
- **Entry points:**
  - `apps/web/app/[locale]/(admin)/admin/restaurants/page.tsx` — paginated restaurant list
  - `apps/web/app/[locale]/(admin)/admin/restaurants/[id]/page.tsx` — restaurant detail + admins tab
  - `apps/web/app/[locale]/(admin)/admin/restaurant-admins/page.tsx` — restaurant admin users (filtered from `GET /users`)

## Key files

| File | Role |
|------|------|
| `apps/web/app/[locale]/(admin)/layout.tsx` | Sidebar by role: all see Dashboard; only `ADMIN` sees Restaurants + Restaurant Admins; `RESTAURANT_ADMIN` sees restaurant `Select` + `SelectedRestaurantProvider` |
| `apps/web/components/admin/selected-restaurant-context.tsx` | `RESTAURANT_ADMIN` selected restaurant + `localStorage` |
| `apps/web/components/admin/restaurant-admin-restaurant-select.tsx` | Sidebar shadcn `Select` for assigned restaurants |
| `apps/web/components/admin/restaurant-admin-dashboard-summary.tsx` | Dashboard card for selected restaurant |
| `apps/web/lib/types/admin-api.ts` | JSON shapes: `RestaurantProfile`, `UserProfile`, `Paginated`, assignments |
| `apps/web/lib/validations/restaurant.ts` | Zod: `createRestaurantSchema`, `updateRestaurantSchema`, `createRestaurantAdminSchema` |
| `apps/web/lib/services/normalise-error.ts` | Maps `ApiRequestError` / unknown → `Error` with message |
| `apps/web/lib/services/use-restaurant-service.ts` | Client hook: restaurant CRUD, status, default, assign/remove admin, list admins, `getMyRestaurants` |
| `apps/web/lib/services/use-user-service.ts` | Client hook: `getUsers`, `createRestaurantAdmin`, `softDeleteUser` |
| `apps/web/lib/services/restaurant-server.service.ts` | RSC: `getRestaurantsServer`, `getRestaurantServer`, `getRestaurantAdminsServer`, `getMyRestaurantsServer` (`GET /restaurants/my`) |
| `apps/web/lib/services/user-server.service.ts` | RSC: `getUsersServer` |
| `apps/web/lib/api-client.ts` | `delete()` added for `DELETE /restaurants/:id/admins/:userId` |
| `apps/web/components/ui/combobox.tsx` | Reusable searchable select (Popover + Command) |
| `apps/web/components/admin/page-header.tsx` | Title + description + action slot |
| `apps/web/components/admin/data-table.tsx` | Table shell with header row |
| `apps/web/components/admin/status-badge.tsx` | Active / inactive badge |
| `apps/web/components/admin/empty-state.tsx` | Empty list CTA |
| `apps/web/components/admin/restaurants/*` | List client, create/edit dialogs, assign dialog, detail client |
| `apps/web/components/admin/restaurant-admins/*` | List client, create restaurant-admin dialog |

## Routes (locale-prefixed)

| Path | Description |
|------|-------------|
| `/{locale}/admin/restaurants` | List + pagination `?page=` |
| `/{locale}/admin/restaurants/[id]` | Detail, tabs: Details / Admins |
| `/{locale}/admin/restaurant-admins` | Users with `role === RESTAURANT_ADMIN` (from first 100 users) |

## API contract (consumed)

Uses the same Nest routes as [restaurant-module.md](restaurant-module.md) and [auth-user-management.md](auth-user-management.md):

- `GET/POST /restaurants`, `GET/PATCH /restaurants/:id`, `PATCH /restaurants/:id/status`, `PATCH /restaurants/:id/default`
- `GET/POST /restaurants/:id/admins`, `DELETE /restaurants/:id/admins/:userId`
- `GET /users?page&limit`, `POST /users/restaurant-admin`, `DELETE /users/:id`

Base URL: `NEXT_PUBLIC_API_URL` (see [frontend-auth.md](frontend-auth.md)).

## Service layer rules

1. **Client components** use `useRestaurantService()` / `useUserService()` (internally `useApiClient()`). No `fetch` or `useApiClient` in feature components.
2. **Server components** call `createServerApiClient()` via `restaurant-server.service.ts` / `user-server.service.ts`.
3. Services wrap calls in try/catch and `throw normaliseError(e)` so UI can show `error.message`.

## Component hierarchy (high level)

- **Restaurant list page (RSC)** → `getRestaurantsServer` → `RestaurantListClient` → `CreateRestaurantDialog` / `EditRestaurantDialog` / row actions (service hook).
- **Restaurant detail (RSC)** → `getRestaurantServer` + `getRestaurantAdminsServer` → `RestaurantDetailClient` → `EditRestaurantDialog`, `AssignAdminDialog`, remove admin (service hook).
- **Restaurant admins (RSC)** → `getUsersServer` + filter → `RestaurantAdminListClient` → `CreateRestaurantAdminDialog`, deactivate (service hook).

## Design patterns

- **Forms:** `react-hook-form` + `@hookform/resolvers/zod` + shadcn `Form` / `Input` / `Dialog` (same family as auth modals).
- **Styling:** Peppes tokens (`text-headline`, `text-coal`, `border-coal-20`, etc.) aligned with admin layout and [frontend-auth.md](frontend-auth.md).
- **Refresh:** After mutations, `useRouter().refresh()` from `@/i18n/navigation` (or `router.refresh()` in client components).

## Gotchas

- **RSC token refresh:** `server-api` does not refresh tokens; long-lived admin sessions may see 401 on server fetches — rely on client navigation or re-login if needed.
- **User list cap:** Restaurant-admins page and assign dialog use `GET /users` with `limit=100`. More than 100 total users requires API pagination or a role filter endpoint later.
- **UTC labels:** Opening/closing fields are labeled as UTC; values are `HH:MM` strings sent to the API as-is.
- **Selected restaurant for `ADMIN`:** The admin layout loads up to 100 restaurants via `GET /restaurants` into `SelectedRestaurantProvider` only (no sidebar picker). The first restaurant (or `localStorage` if still valid) is used automatically so `useSelectedRestaurant()` works for products/tables without asking platform admins to choose a location.
- **Assign dialog effect deps:** Excluded user IDs are stabilised in `RestaurantDetailClient` with `useMemo` to avoid refetch loops.

## Dependencies on other features

- [frontend-auth.md](frontend-auth.md) — NextAuth session, `proxy.ts` `ADMIN` gate, `useApiClient`.
- [restaurant-module.md](restaurant-module.md) — backend behaviour and validation.
- [auth-user-management.md](auth-user-management.md) — users list and restaurant-admin creation.
