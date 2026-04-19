/** Public menu listing path (global or restaurant-scoped). */
export function menuListingPath(restaurantCode?: string | null): string {
  const c = restaurantCode?.trim();
  if (c) return `/menu/r/${encodeURIComponent(c)}`;
  return "/menu";
}

/** Product details URL under menu; optional `restaurantCode` preserves scope when closing the modal. */
export function menuProductPath(
  productId: string,
  restaurantCode?: string | null,
): string {
  const base = `/menu/product/${encodeURIComponent(productId)}`;
  const c = restaurantCode?.trim();
  if (!c) return base;
  return `${base}?${new URLSearchParams({ restaurantCode: c }).toString()}`;
}

/**
 * Short product URL (e.g. deep link from home). Closing the modal returns to `/` unless nested under `/menu/product/…`.
 */
export function standaloneProductPath(
  productId: string,
  restaurantCode?: string | null,
): string {
  const base = `/product/${encodeURIComponent(productId)}`;
  const c = restaurantCode?.trim();
  if (!c) return base;
  return `${base}?${new URLSearchParams({ restaurantCode: c }).toString()}`;
}
