# Feature: Restaurant tables & table reservations

## Summary

Physical **restaurant tables** (table number, seat count, optional location/notes) are managed by **assigned RESTAURANT_ADMIN** only. **USER** customers request a reservation for a time range; new rows default to **PENDING** until staff **Confirm** (or the slot stays pending). **CONFIRMED** overlaps with **PENDING** or **CONFIRMED** are rejected. Staff can **Unconfirm** a future **CONFIRMED** booking back to **PENDING**. Public **occupied-slots** supports the customer calendar UI.

## Status

**complete**

## Scope

- **App(s):** `apps/api`, `apps/web`
- **Entry points:**
  - [`apps/api/src/restaurant-tables/restaurant-tables.controller.ts`](apps/api/src/restaurant-tables/restaurant-tables.controller.ts) — table CRUD + public occupied slots
  - [`apps/api/src/restaurant-tables/restaurant-reservations.controller.ts`](apps/api/src/restaurant-tables/restaurant-reservations.controller.ts) — create (USER), list, confirm / unconfirm (RESTAURANT_ADMIN)
  - [`apps/api/src/restaurant-tables/user-reservations.controller.ts`](apps/api/src/restaurant-tables/user-reservations.controller.ts) — my reservations, cancel
  - [`apps/web/app/[locale]/(admin)/admin/tables/page.tsx`](apps/web/app/[locale]/(admin)/admin/tables/page.tsx) — admin tables + reservations UI
  - [`apps/web/app/[locale]/(app)/reserve/page.tsx`](apps/web/app/[locale]/(app)/reserve/page.tsx) — customer booking + my reservations

## Key files

| File | Role |
|------|------|
| `apps/api/prisma/schema.prisma` | `RestaurantTable`, `TableReservation`, `TableReservationStatus` |
| `apps/api/src/restaurant-tables/restaurant-tables.module.ts` | Nest module |
| `apps/api/src/restaurant-tables/restaurant-scope.service.ts` | `assertAssignedRestaurantAdmin` |
| `apps/api/src/restaurant-tables/restaurant-tables.service.ts` | Table CRUD, public active list |
| `apps/api/src/restaurant-tables/table-reservations.service.ts` | Booking, overlap, sweep, confirm/unconfirm, public occupied list |
| `apps/api/src/restaurant-tables/dto/*.ts` | Validation DTOs (incl. `occupied-slots-query.dto.ts`) |
| `apps/web/lib/services/use-restaurant-tables-service.ts` | Client table API |
| `apps/web/lib/services/use-table-reservations-service.ts` | Client reservations API |
| `apps/web/lib/fetch-table-occupied-slots.ts` | Public fetch for booking UI |
| `apps/web/components/ui/calendar.tsx` | `react-day-picker` + default CSS |
| `apps/web/components/reserve/reserve-booking-scheduler.tsx` | Calendar + time selects + availability |
| `apps/web/lib/validations/restaurant-tables.ts` | Zod schemas |
| `apps/web/components/admin/tables/*` | Admin dialogs + page client |

## API contract

Base URL: same as other Nest routes (no global prefix).

### Public

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/restaurants/:restaurantId/tables` | Active tables; **404** if restaurant missing/inactive |
| `GET` | `/restaurants/:restaurantId/tables/:tableId/occupied-slots?from=&to=` | ISO **from** / **to**; returns `{ slots: { startsAt, endsAt }[] }` for **PENDING** + **CONFIRMED** overlapping the window; max **200** days |

### Authenticated

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/restaurants/:restaurantId/tables/manage` | `RESTAURANT_ADMIN` | All tables |
| `POST` | `/restaurants/:restaurantId/tables` | `RESTAURANT_ADMIN` | Create table |
| `PATCH` | `/restaurants/:restaurantId/tables/:tableId` | `RESTAURANT_ADMIN` | Update table |
| `DELETE` | `/restaurants/:restaurantId/tables/:tableId` | `RESTAURANT_ADMIN` | Delete if no reservations |
| `GET` | `/restaurants/:restaurantId/reservations` | `RESTAURANT_ADMIN` | List reservations; optional `startsFrom`, `startsTo` |
| `PATCH` | `/restaurants/:restaurantId/reservations/:id/confirm` | `RESTAURANT_ADMIN` | **PENDING** → **CONFIRMED** (re-check overlap) |
| `PATCH` | `/restaurants/:restaurantId/reservations/:id/unconfirm` | `RESTAURANT_ADMIN` | **CONFIRMED** → **PENDING** if **startsAt** is still in the future |
| `POST` | `/restaurants/:restaurantId/reservations` | `USER` | Create **PENDING** request; **409** on overlap |
| `GET` | `/reservations/me` | `USER` | Paginated list |
| `PATCH` | `/reservations/:id/cancel` | `USER` | Cancel own **PENDING** or **CONFIRMED** before start |

## Data model

```prisma
enum TableReservationStatus {
  CONFIRMED
  CANCELLED
  COMPLETED
  PENDING
}

model TableReservation {
  status TableReservationStatus @default(PENDING)
  // ...
}
```

## Dependencies on other features

- Auth JWT + roles — [auth-user-management.md](auth-user-management.md)
- Restaurant + assignments — [restaurant-module.md](restaurant-module.md)
- Public menu / location — [frontend-menu.md](frontend-menu.md) (reserve uses selected restaurant from header)

## Key decisions & gotchas

- **Blocking slots:** overlap checks and occupied-slots use **PENDING** + **CONFIRMED** (ended rows are swept first).
- **Sweep:** **CONFIRMED** with `endsAt < now` → **COMPLETED**; **PENDING** with `endsAt < now` → **CANCELLED** (frees the slot if a request was never confirmed).
- **Cancel (USER):** allowed for **PENDING** and **CONFIRMED** before `startsAt`.
- **Migrations:** apply `20260416120000_add_pending_table_reservation_status` so enum + default exist in PostgreSQL.
- **Web reserve:** shadcn-style **Calendar** + time selects; submit disabled until the chosen range does not overlap loaded occupied slots.

## TODOs / open questions

- [ ] Optional: enforce reservation windows against `openingTime` / `closingTime` + `timezone`.
- [ ] Optional: guest bookings without accounts (email/phone on reservation).
