# Feature: Backend product management (API)

## Summary

Global catalog managed by **ADMIN**: categories, subcategories, allergy items, products with optional variants and allergy links. Products are **not** owned by restaurants. **RESTAURANT_ADMIN** links **published** products to their assigned restaurants via `RestaurantProduct` and toggles availability. Public endpoints expose published data for menus.

## Status

**complete** — API only; admin UI and image upload service are future work.

## Scope

- **App(s):** `apps/api`
- **Entry points:**
  - `apps/api/src/categories/categories.controller.ts` — `/categories`
  - `apps/api/src/allergy-items/allergy-items.controller.ts` — `/allergy-items`
  - `apps/api/src/products/products.controller.ts` — `/products`
  - `apps/api/src/restaurant-products/restaurant-products.controller.ts` — `/restaurants/:restaurantId/products`
  - `apps/api/src/auth/guards/optional-jwt-auth.guard.ts` — optional JWT for `GET /products/:id` (admin sees unpublished)

## Key Files

| File | Role |
|------|------|
| `apps/api/prisma/schema.prisma` | `Category`, `SubCategory`, `AllergyItem`, `Product`, `ProductVariant`, `ProductAllergyItem`, `RestaurantProduct`, `Ingredient`, `ProductIngredient` |
| `apps/api/src/common/prisma-error.util.ts` | Shared `isPrismaUniqueViolation` + `uniqueConstraintFieldsFromMeta` (used by all 4 services) |
| `apps/api/src/categories/*` | Category + subcategory CRUD |
| `apps/api/src/allergy-items/*` | Allergy catalog CRUD |
| `apps/api/src/products/*` | Product CRUD, variants, allergy links, publish, soft delete |
| `apps/api/src/restaurant-products/*` | Restaurant–product linking (RESTAURANT_ADMIN) |
| `apps/api/src/app.module.ts` | Registers four modules |
| `apps/api/src/categories/categories.service.spec.ts` | Unit tests (mocked Prisma) |
| `apps/api/src/allergy-items/allergy-items.service.spec.ts` | Unit tests |
| `apps/api/src/products/products.service.spec.ts` | Unit tests |
| `apps/api/src/restaurant-products/restaurant-products.service.spec.ts` | Unit tests |

## API Contract

Base URL: no global prefix (e.g. `http://localhost:3001`).

### Categories

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/categories` | public | List categories with `_count` of subcategories and products |
| `POST` | `/categories` | ADMIN | Create |
| `GET` | `/categories/:id` | public | Category + ordered subcategories |
| `PATCH` | `/categories/:id` | ADMIN | Partial update |
| `DELETE` | `/categories/:id` | ADMIN | Delete; **409** if any product uses category |
| `POST` | `/categories/:id/subcategories` | ADMIN | Create subcategory |
| `PATCH` | `/categories/:id/subcategories/:subId` | ADMIN | Update subcategory |
| `DELETE` | `/categories/:id/subcategories/:subId` | ADMIN | Delete; **409** if any product uses subcategory |

### Allergy items

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/allergy-items` | public | List (name asc) |
| `GET` | `/allergy-items/:id` | public | One |
| `POST` | `/allergy-items` | ADMIN | Create |
| `PATCH` | `/allergy-items/:id` | ADMIN | Update |
| `DELETE` | `/allergy-items/:id` | ADMIN | Delete (join rows cascade) |

### Products

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/products/all` | ADMIN | Paginated list (all states); query: `page`, `limit`, `categoryId`, `subCategoryId` |
| `GET` | `/products` | public | Paginated **published + active** only; same query |
| `POST` | `/products` | ADMIN | Create; `subCategoryId` must belong to `categoryId` |
| `GET` | `/products/:id` | optional JWT | **ADMIN** with Bearer: any product; else **published + active** only |
| `PATCH` | `/products/:id/publish` | ADMIN | `{ isPublished }`; cannot publish inactive product; requires `basePrice` **or** ≥1 active variant |
| `PATCH` | `/products/:id` | ADMIN | Partial update |
| `DELETE` | `/products/:id` | ADMIN | Soft delete: `isActive: false`, `isPublished: false` |
| `POST` | `/products/:id/variants` | ADMIN | Add variant; clears `product.basePrice` / `salePrice` |
| `PATCH` | `/products/:id/variants/:variantId` | ADMIN | Update variant (incl. `isActive`) |
| `DELETE` | `/products/:id/variants/:variantId` | ADMIN | **400** if last active variant and no `basePrice` |
| `POST` | `/products/:id/allergy-items` | ADMIN | `{ allergyItemIds: string[] }` (`skipDuplicates`) |
| `DELETE` | `/products/:id/allergy-items/:allergyItemId` | ADMIN | Remove link |

**Response shape (`ProductProfile`):** includes `pricing: { hasVariants, basePrice, salePrice, variants[] }`. If any **active** variant exists, `hasVariants` is true and product-level `basePrice`/`salePrice` in the envelope are `null` (variant prices used). Otherwise product-level decimals apply. Money values are **strings** (decimal serialization).

### Restaurant products

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/restaurants/:restaurantId/products` | public | Products linked with `isAvailable: true` and published+active |
| `POST` | `/restaurants/:restaurantId/products` | RESTAURANT_ADMIN | `{ productId }`; product must be published; **403** if not assigned; **409** if duplicate link |
| `PATCH` | `/restaurants/:restaurantId/products/:productId` | RESTAURANT_ADMIN | `{ isAvailable }` |
| `DELETE` | `/restaurants/:restaurantId/products/:productId` | RESTAURANT_ADMIN | Remove link |

## Data Model

See `apps/api/prisma/schema.prisma` for full definitions. Highlights:

- `Product` optional `basePrice` / `salePrice`; variant-level prices on `ProductVariant`.
- `RestaurantProduct` unique `(restaurantId, productId)`.
- `Ingredient` / `ProductIngredient`: schema only for future add/exclude flows (no API yet).

## State & Data Flow

```
ADMIN → ProductsService → Prisma → PostgreSQL
RESTAURANT_ADMIN → RestaurantProductsService → verifies assignment → RestaurantProduct
Public → GET products / categories / restaurant menu → published + active filters
```

## Environment Variables

No new variables; uses existing `DATABASE_URL` and JWT secrets.

## Dependencies on Other Features

- Auth JWT + `RolesGuard`; see [auth-user-management.md](auth-user-management.md).
- Restaurant assignments; see [restaurant-module.md](restaurant-module.md).

## Key Decisions & Gotchas

- **Optional JWT** on `GET /products/:id`: `OptionalJwtAuthGuard` allows anonymous access; valid ADMIN Bearer sees unpublished products.
- **Adding a variant** nulls product `basePrice`/`salePrice` so pricing stays variant-driven until admin sets base price again after removing variants.
- **P2002** helpers extracted to `src/common/prisma-error.util.ts`; no `instanceof PrismaClientKnownRequestError` (breaks under ESM/Jest).
- **salePrice validation**: `assertPricing()` in `ProductsService` throws `BadRequestException` if `salePrice >= basePrice`, checked in `create`, `update`, `addVariant`, `updateVariant`.
- **addAllergyItems deduplication**: input `allergyItemIds` is deduplicated via `Set` before the DB length check, preventing false-positive "invalid IDs" errors for duplicate client values.
- **publish single round-trip**: `publish()` fetches product + active variants in one query (no separate `canPublish` helper call).
- **removeVariant parallelism**: product (`select: basePrice`) and variant count queries run via `Promise.all`, saving one sequential round-trip.
- **ESM:** relative imports use `.js` extensions in TypeScript sources.
- **Ingredient API** intentionally omitted; models exist for future order-time customization.

## TODOs / Open Questions

- [ ] Admin / restaurant-admin UI for catalog and linking
- [ ] E2E tests for product and restaurant-product routes (unit coverage exists for all four services)
- [ ] Image upload (replace raw `imageUrl` strings)
