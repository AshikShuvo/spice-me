# Feature: Platform common settings (VAT + currency)

## Summary

Singleton **platform** settings store global **food VAT %** and **ISO currency**. Customer-facing product payloads (`GET /menu`, public `GET /products`, public `GET /restaurants/:id/products`) apply VAT to all price strings unless `Product.isVatExclusive` is true. Admin and restaurant-admin catalog APIs return **net** prices (stored DB values). The web app formats all money with `Intl` using the configured currency.

## Status

**complete**

## Scope

- **App(s):** `apps/api`, `apps/web`
- **Entry points:**
  - `apps/api/src/platform-settings/platform-settings.controller.ts` — `GET/PATCH /platform/settings`
  - `apps/web/app/[locale]/(admin)/admin/settings/page.tsx` — admin UI (ADMIN only)

## Key Files

| File | Role |
|------|------|
| `apps/api/prisma/schema.prisma` | `PlatformCommonSettings`, `Product.isVatExclusive` |
| `apps/api/src/platform-settings/*` | Nest module, DTOs, service |
| `apps/api/src/common/food-vat.util.ts` | `applyFoodVatToProfile` (Decimal math) |
| `apps/api/src/products/products.service.ts` | `ProductProfile.isVatExclusive`, public list/detail VAT |
| `apps/api/src/menu/menu.service.ts` | `MenuResponse.currencyCode`, VAT on products |
| `apps/api/src/restaurant-products/restaurant-products.service.ts` | VAT on `findAvailable` |
| `apps/web/lib/fetch-platform-settings.ts` | RSC fetch for settings |
| `apps/web/components/platform-currency/platform-currency-context.tsx` | Context + client refresh |
| `apps/web/lib/money/format-currency.ts` | `formatCurrencyAmount` |
| `apps/web/components/menu/product-price.tsx` | Menu pricing display |
| `apps/web/lib/validations/product.ts` | `isVatExclusive` on create/update product |

## API Contract

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/platform/settings` | public | `{ foodVatPercent: string, currencyCode: string }` |
| `PATCH` | `/platform/settings` | ADMIN | Body: optional `foodVatPercent` (0–100), `currencyCode` (allowed ISO list) |

`GET /menu` response includes `currencyCode` (aligned with platform settings).

## Data Model

```prisma
model PlatformCommonSettings {
  id             String   @id @default("default")
  foodVatPercent Decimal  @default(0) @db.Decimal(5, 2)
  currencyCode   String   @default("EUR")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

// Product
isVatExclusive Boolean @default(false)
```

## Dependencies

- Auth for `PATCH /platform/settings`
- Products/menu as consumers of VAT + currency

## Gotchas

- **Customer vs admin prices:** Only anonymous/public product reads and menu apply VAT; `GET /products/all` and admin `GET /products/:id` return net.
- **VAT-exclusive:** `isVatExclusive` skips the multiplier for that product’s entire `pricing` block (including variants).
- **Web provider:** `PlatformCurrencyProvider` lives in `[locale]/layout.tsx`; menu still passes `formatMenuAmount` from `menu.currencyCode` for consistency with the menu payload.
