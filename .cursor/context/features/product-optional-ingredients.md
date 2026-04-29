# Feature: Product optional ingredients & templates

## Summary

Admins manage a global **ingredient** catalog and reusable **ingredient templates** (named sets of ingredients with default extra prices). Each **product** can have **product ingredient** links (`canAdd` + `extraPrice`) either manually or by **merging** a template (upsert by ingredient; does not remove existing links). Customers see **optional ingredients** on the product modal with checkboxes; line total includes base price + selected extras × quantity. **Cart wiring** is stubbed via `console.log` payload.

## Status

**complete**

## Scope

- **App(s):** `apps/api`, `apps/web`
- **Entry points:**
  - `apps/api/src/ingredients/*` — ingredient CRUD
  - `apps/api/src/ingredient-templates/*` — template CRUD
  - `apps/api/src/products/*` — product ingredient upsert/remove, template apply, `ProductProfile` extras
  - `apps/web/app/[locale]/(admin)/admin/products/ingredients/page.tsx`
  - `apps/web/app/[locale]/(admin)/admin/products/ingredient-templates/page.tsx`
  - `apps/web/app/[locale]/(admin)/admin/products/ingredient-templates/[id]/page.tsx`
  - `apps/web/components/menu/product-details-modal.tsx` — customer extras UI

## Key Files

| File | Role |
|------|------|
| `apps/api/prisma/schema.prisma` | `Ingredient`, `ProductIngredient`, `IngredientTemplate`, `IngredientTemplateItem`, `Product.maxOptionalIngredients` |
| `apps/api/src/products/product-include.ts` | Includes `ingredients` on product reads |
| `apps/api/src/products/products.service.ts` | `ingredientLinks`, `optionalIngredients`, upsert/remove/apply |
| `apps/api/src/common/food-vat.util.ts` | VAT scaling for optional ingredient prices (public menu) |
| `apps/web/lib/types/admin-api.ts` | `ProductProfile` extras types |
| `apps/web/components/admin/products/catalog/product-detail-client.tsx` | Max extras, template apply, extras table |
| `apps/web/components/menu/product-details-modal.tsx` | Checkboxes, total, stub cart log |

## API Contract (sketch)

### Ingredients (`/ingredients`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/ingredients` | public | List |
| GET | `/ingredients/:id` | public | One |
| POST | `/ingredients` | ADMIN | Create |
| PATCH | `/ingredients/:id` | ADMIN | Update |
| DELETE | `/ingredients/:id` | ADMIN | Delete (409 if referenced) |

### Ingredient templates (`/ingredient-templates`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/ingredient-templates` | public | List with items |
| GET | `/ingredient-templates/:id` | public | One |
| POST | `/ingredient-templates` | ADMIN | Create with `items[]` |
| PATCH | `/ingredient-templates/:id` | ADMIN | Partial update; `items` replaces all items when sent |
| DELETE | `/ingredient-templates/:id` | ADMIN | Delete |

### Products — extras

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PATCH | `/products/:id` | ADMIN | `maxOptionalIngredients` (null = unlimited, min 1 when set) |
| POST | `/products/:id/product-ingredients` | ADMIN | Upsert link (`UpsertProductIngredientDto`) |
| DELETE | `/products/:id/product-ingredients/:linkId` | ADMIN | Remove link |
| POST | `/products/:id/ingredient-templates/:templateId/apply` | ADMIN | Merge template into product (upsert) |

### ProductProfile additions

- `maxOptionalIngredients: number | null`
- `ingredientLinks`: full rows for admin
- `optionalIngredients`: subset where `canAdd && extraPrice != null` (customer extras)

Public product/menu responses apply food VAT to `optionalIngredients` / `ingredientLinks` extra prices unless `isVatExclusive`.

## Data Model (Prisma)

- `IngredientTemplate`, `IngredientTemplateItem` (per-item `extraPrice`)
- `Product.maxOptionalIngredients`
- `ProductIngredient.sortOrder`

## Gotchas

- **Merge semantics:** Applying a template **upserts** by `(productId, ingredientId)`; it does **not** delete other extras.
- **VAT:** Extra prices follow the same gross/net rules as product prices on public endpoints.
- **Optional extras:** Customer UI uses `optionalIngredients` only (IDs are `ProductIngredient.id`).

## Dependencies

- Platform settings (food VAT %) for customer-facing totals.
