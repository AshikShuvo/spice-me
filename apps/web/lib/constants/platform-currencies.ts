/** Must stay in sync with API `PLATFORM_CURRENCY_CODES`. */
export const PLATFORM_CURRENCY_OPTIONS = [
  "EUR",
  "GBP",
  "NOK",
  "SEK",
  "DKK",
  "USD",
  "CHF",
  "PLN",
] as const;

export type PlatformCurrencyOption = (typeof PLATFORM_CURRENCY_OPTIONS)[number];
