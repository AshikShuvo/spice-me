# Feature: Frontend public menu (browse)

## Summary

Customer-facing **Menu** route: category row, subcategory row (including **All**), responsive product grid with section headers when **All** is selected. Tapping a product opens a **details modal** (image, description, optional multi-variant chips, quantity stepper, **Add to cart** showing line total). Cart is not wired yet — the CTA only `console.log`s. Data comes from public `GET /menu` (optional `restaurantCode` query on the API). The page uses **ISR** (`revalidate = 60`) and **static params** so HTML is pre-rendered; all categories ship in one payload (client-side filtering).

**Public location context:** the shared app header includes a **location** `Select` backed by `GET /restaurants/browse`. The choice is stored in `localStorage` and synced from `/menu/r/{code}` URLs. Browsing `/menu` without a selection shows the **global** catalog; choosing a location refetches the menu client-side when the server-rendered payload does not already match. The **Reserve** page uses the same selection (via `fetchMenuPublicClient`) to resolve `restaurantId` for tables and booking.

## Status

**complete**

## Scope

- **App(s):** `apps/web`
- **Entry points:**
  - `apps/web/app/[locale]/(app)/menu/[[...slug]]/page.tsx` — RSC + `generateStaticParams`, `fetchMenu`, `MenuBrowseClient`
  - `apps/web/proxy.ts` — redirects `/menu?restaurantCode=X` → `/menu/r/X` (locale-prefixed) so legacy query URLs stay valid without forcing dynamic `searchParams` on the page
  - `apps/api/src/menu/menu.controller.ts` — `GET /menu`

## Key Files

| File | Role |
|------|------|
| `apps/web/lib/types/menu-api.ts` | `MenuResponse` types (mirrors API) |
| `apps/web/lib/fetch-menu.ts` | Server-side `fetchMenu` using `NEXT_PUBLIC_API_URL` (`next.revalidate: 60`) |
| `apps/web/components/menu/menu-browse-client.tsx` | Category/subcategory state, sectioning, grid, product details modal state |
| `apps/web/components/menu/menu-product-card.tsx` | Clickable card (image, title, description, price) |
| `apps/web/components/menu/product-details-modal.tsx` | Radix dialog: responsive product sheet, variants, qty, stub add-to-cart |
| `apps/web/components/menu/product-price.tsx` | Shared price / variants display + exported pricing helpers (`resolveDisplayRow`, `getActiveVariants`, etc.); also used by admin `PricingBadge` |
| `apps/web/components/public-restaurant/public-restaurant-context.tsx` | Client provider: `restaurantCode`, `setRestaurantCode`, LS + `/menu/r/*` URL sync |
| `apps/web/components/public-restaurant/public-restaurant-picker.tsx` | Header `Select`: all locations + `GET /restaurants/browse`; updates context and `/menu` routes when on menu |
| `apps/web/lib/fetch-menu-public-client.ts` | Client `GET /menu` (`cache: no-store`) when context changes |
| `apps/web/lib/fetch-restaurants-browse-client.ts` | Client `GET /restaurants/browse` |
| `apps/web/lib/i18n-pathname.ts` | `stripLocalePrefix` (shared with nav + context) |
| `apps/web/messages/en.json` / `no.json` | `menu.*`, `header.*`, `reserve.*` strings |

## Routes

| URL | Meaning |
|-----|--------|
| `/{locale}/menu` | Global published catalog |
| `/{locale}/menu/r/{code}` | Restaurant-scoped menu (e.g. `RQ0001`) |
| `/{locale}/menu?restaurantCode=X` | Redirected to `/menu/r/X` by `proxy.ts` |

## API Contract

- `GET /menu` — optional query `restaurantCode`
- `GET /restaurants/browse` — public; active restaurants as `{ id, name, code }[]`
- Response: `{ scope, restaurant, categories[], products[] }` — see backend feature doc

## Data Flow

```
menu/[[...slug]]/page.tsx (RSC, ISR revalidate 60)
  → fetchMenu(restaurantCode from slug segment r/{code})
  → MenuBrowseClient(initialMenu)
  → filter/group products by selected category & subcategory
  → optional ProductDetailsModal when user selects a product
```

## Static generation

- `generateStaticParams` returns `{ slug: undefined }` for the base `/menu` (combined with `[locale]` params for each locale).
- At **build** time, if `GET {API}/restaurants/default` succeeds, also pre-renders `{ slug: ['r', code] }` for the default restaurant (per locale product of params).
- Other `/menu/r/{code}` paths are still available **on demand** (`dynamicParams` default) and use the same ISR window.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | NestJS base URL for `fetchMenu` and optional build-time default restaurant |

## Dependencies

- Backend: [backend-product-management.md](backend-product-management.md) (`GET /menu`, `ProductProfile`, `GET /restaurants/default` for build-time static params)

## Gotchas

- Product images use a native `<img>` (not `next/image`) with `suppressHydrationWarning` so extensions that rewrite image markup (e.g. extra classes / `filter`) do not cause hydration mismatches; first-row cards use `loading="eager"` and `fetchPriority="high"` for LCP.
- Inactive categories are excluded server-side; their products do not appear in the payload.
- Do not read `searchParams` on the menu page — that opts the route out of static ISR; use path `/menu/r/{code}` or the proxy redirect instead.
- Modal close defers clearing `detailsProduct` briefly so Radix can finish the close animation without unmounting content early.
