/** Format a numeric amount with `Intl` (symbol from ISO 4217 `currencyCode`). */
export function formatCurrencyAmount(
  amount: string | number,
  currencyCode: string,
  locale: string,
): string {
  const n = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  if (!Number.isFinite(n)) {
    return "";
  }
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  }
}
