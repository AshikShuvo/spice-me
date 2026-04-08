# Feature: Frontend Product Management

## Status
`complete`

## Overview
A full "Products" section in the admin shell, supporting two roles:
- **ADMIN** — full catalog management (categories, subcategories, allergy items, products, variants).
- **RESTAURANT_ADMIN** — manage products linked to their selected restaurant (availability toggling, adding from catalog).

---

## Key Files

### Backend (added in this feature)
| File | Change |
|---|---|
| `apps/api/src/restaurant-products/restaurant-products.service.ts` | Added `findAllManaged()` — returns all linked products for a restaurant, regardless of `isAvailable` |
| `apps/api/src/restaurant-products/restaurant-products.controller.ts` | Added `GET /restaurants/:restaurantId/products/manage` (auth: `RESTAURANT_ADMIN`) |

### Frontend — Types & Validation
| File | Purpose |
|---|---|
| `apps/web/lib/types/admin-api.ts` | Appended `SubCategoryProfile`, `CategoryProfile`, `AllergyItemProfile`, `ProductVariantProfile`, `ProductProfile`, `RestaurantProductManageRow` |
| `apps/web/lib/validations/category.ts` | Zod schemas for create/update category and subcategory |
| `apps/web/lib/validations/allergy-item.ts` | Zod schemas for create/update allergy items |
| `apps/web/lib/validations/product.ts` | Zod schemas for create/update product and variants, with `offerPrice < regularPrice` refine |

### Frontend — Services
| File | Purpose |
|---|---|
| `apps/web/lib/services/category-server.service.ts` | RSC: `getCategoriesServer()`, `getCategoryServer(id)` |
| `apps/web/lib/services/allergy-item-server.service.ts` | RSC: `getAllergyItemsServer()` |
| `apps/web/lib/services/product-server.service.ts` | RSC: `getProductsAdminServer(page, limit, ...)`, `getProductServer(id)` |
| `apps/web/lib/services/use-category-service.ts` | Client hook: CRUD for categories + subcategories |
| `apps/web/lib/services/use-allergy-item-service.ts` | Client hook: CRUD for allergy items |
| `apps/web/lib/services/use-product-service.ts` | Client hook: full product + variant + allergy management |
| `apps/web/lib/services/use-restaurant-product-service.ts` | Client hook: manage restaurant-linked products |

### Frontend — Layout & Shared Components
| File | Purpose |
|---|---|
| `apps/web/app/[locale]/(admin)/layout.tsx` | Added "Products" sidebar section with role-based links |
| `apps/web/components/admin/products/product-status-badge.tsx` | Draft/Published/Inactive badge |
| `apps/web/components/admin/products/pricing-badge.tsx` | Price display via `ProductPrice` (`pricing.display` + offer strikethrough) |

### Frontend — Pages & Page Components
| Route | RSC file | Client file(s) |
|---|---|---|
| `/admin/products` | `admin/products/page.tsx` | `products-overview-client.tsx` (ADMIN), `restaurant-products-client.tsx` + `add-product-dialog.tsx` (RESTAURANT_ADMIN) |
| `/admin/products/categories` | `admin/products/categories/page.tsx` | `categories/category-list-client.tsx`, `create-category-dialog.tsx`, `edit-category-dialog.tsx` |
| `/admin/products/subcategories` | `admin/products/subcategories/page.tsx` | `subcategories/subcategory-list-client.tsx`, `create-subcategory-dialog.tsx`, `edit-subcategory-dialog.tsx` |
| `/admin/products/allergy-items` | `admin/products/allergy-items/page.tsx` | `allergy-items/allergy-item-list-client.tsx`, `create-allergy-item-dialog.tsx`, `edit-allergy-item-dialog.tsx` |
| `/admin/products/catalog` | `admin/products/catalog/page.tsx` | `catalog/product-list-client.tsx`, `catalog/create-product-dialog.tsx` |
| `/admin/products/catalog/[id]` | `admin/products/catalog/[id]/page.tsx` | `catalog/product-detail-client.tsx`, `add-variant-dialog.tsx`, `edit-variant-dialog.tsx` |

---

## API Contract

### Category endpoints
```
GET    /categories                        → CategoryProfile[]
GET    /categories/:id                    → CategoryProfile (includes subCategories)
POST   /categories                        → CategoryProfile  (ADMIN)
PATCH  /categories/:id                    → CategoryProfile  (ADMIN)
DELETE /categories/:id                    → { message }      (ADMIN) — 409 if products exist
POST   /categories/:id/subcategories      → SubCategoryProfile (ADMIN)
PATCH  /categories/:id/subcategories/:sub → SubCategoryProfile (ADMIN)
DELETE /categories/:id/subcategories/:sub → { message }        (ADMIN)
```

### Allergy item endpoints
```
GET    /allergy-items      → AllergyItemProfile[]
POST   /allergy-items      → AllergyItemProfile  (ADMIN)
PATCH  /allergy-items/:id  → AllergyItemProfile  (ADMIN)
DELETE /allergy-items/:id  → { message }         (ADMIN)
```

### Product endpoints
```
GET    /products                         → Paginated<ProductProfile> (public, isPublished)
GET    /products/all                     → Paginated<ProductProfile> (ADMIN)
GET    /products/:id                     → ProductProfile
POST   /products                         → ProductProfile  (ADMIN)
PATCH  /products/:id                     → ProductProfile  (ADMIN)
PATCH  /products/:id/publish             → ProductProfile  (ADMIN)
DELETE /products/:id                     → { message }     (ADMIN)
POST   /products/:id/variants            → ProductProfile  (ADMIN)
PATCH  /products/:id/variants/:vId       → ProductProfile  (ADMIN)
DELETE /products/:id/variants/:vId       → ProductProfile  (ADMIN)
POST   /products/:id/allergy-items       → ProductProfile  (ADMIN)
DELETE /products/:id/allergy-items/:aId  → ProductProfile  (ADMIN)
```

### Restaurant product endpoints
```
GET    /restaurants/:rId/products         → ProductProfile[]         (public, isAvailable)
GET    /restaurants/:rId/products/manage  → RestaurantProductManageRow[] (RESTAURANT_ADMIN)
POST   /restaurants/:rId/products         → RestaurantProductManageRow  (RESTAURANT_ADMIN)
PATCH  /restaurants/:rId/products/:pId    → RestaurantProductManageRow  (RESTAURANT_ADMIN)
DELETE /restaurants/:rId/products/:pId    → { message }                 (RESTAURANT_ADMIN)
```

---

## Data Model (frontend types)

```typescript
ProductProfile.pricing {
  hasVariants: boolean
  regularPrice: string | null   // null when any variant row exists
  offerPrice: string | null
  display: { regularPrice: string | null; offerPrice: string | null }  // menu / card row
  variants: ProductVariantProfile[]  // includes isDefault; all rows for admin detail
}
```

---

## Gotchas

- `GET /restaurants/:id/products/manage` MUST be registered before `PATCH :productId` in the NestJS controller (route order matters — already done).
- `/admin/products` page for `RESTAURANT_ADMIN` renders `<RestaurantProductsClient />` directly (no RSC data fetch, as selected restaurant is localStorage/context-based).
- Product detail **regular/offer** fields are **disabled** when `product.pricing.variants.length > 0` (any variant row). Show a note explaining per-variant pricing.
- **Default variant**: admin can set which active variant drives `pricing.display` (menu card price).
- `offerPrice` validation is enforced both client-side (zod `.refine()`) and server-side.
- Image URL is a plain text input (no upload API). Image preview renders with `onError` fallback hiding the broken img.
- All `<img>` tags in admin components use `// eslint-disable-next-line @next/next/no-img-element` (these are internal admin pages).
- Subcategory list page fetches subcategory details lazily (via `categoryService.getCategory(id)`) when a category is selected — the list endpoint only returns `_count`.

---

## Patterns Used
- **RSC pages**: `await auth()`, `setRequestLocale`, `generateStaticParams`, `notFound()` on fetch failure
- **Client components**: `"use client"`, `useXxxService()`, mutations call `router.refresh()` after success
- **Error display**: `form.setError("root", { message })` shown as `<p className="text-body text-destructive" role="alert">`
- **Loading states**: `busyId: string | null` pattern on buttons
- **Dialog forms**: `zodResolver`, `useForm` with `defaultValues`, `DialogContent` with `max-h-[90vh] overflow-y-auto sm:max-w-lg`