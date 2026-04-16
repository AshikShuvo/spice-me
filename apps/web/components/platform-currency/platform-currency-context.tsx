"use client";

import { formatCurrencyAmount } from "@/lib/money/format-currency";
import type { PlatformSettingsResponse } from "@/lib/types/platform-settings";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocale } from "next-intl";

type Ctx = {
  currencyCode: string;
  foodVatPercent: string;
  locale: string;
  formatAmount: (amount: string | number) => string;
};

const PlatformCurrencyContext = createContext<Ctx | null>(null);

const defaultSettings: PlatformSettingsResponse = {
  foodVatPercent: "0",
  currencyCode: "EUR",
};

type Props = {
  children: ReactNode;
  /** From RSC fetch so first paint matches server. */
  initial?: PlatformSettingsResponse | null;
};

export function PlatformCurrencyProvider({ children, initial }: Props) {
  const locale = useLocale();
  const [settings, setSettings] = useState<PlatformSettingsResponse>(
    initial ?? defaultSettings,
  );

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    void fetch(`${base}/platform/settings`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PlatformSettingsResponse | null) => {
        if (data?.currencyCode) {
          setSettings({
            currencyCode: data.currencyCode,
            foodVatPercent: data.foodVatPercent ?? "0",
          });
        }
      })
      .catch(() => {});
  }, []);

  const formatAmount = useCallback(
    (amount: string | number) =>
      formatCurrencyAmount(amount, settings.currencyCode, locale),
    [settings.currencyCode, locale],
  );

  const value = useMemo(
    () => ({
      currencyCode: settings.currencyCode,
      foodVatPercent: settings.foodVatPercent,
      locale,
      formatAmount,
    }),
    [settings, locale, formatAmount],
  );

  return (
    <PlatformCurrencyContext.Provider value={value}>
      {children}
    </PlatformCurrencyContext.Provider>
  );
}

export function usePlatformCurrency(): Ctx {
  const ctx = useContext(PlatformCurrencyContext);
  if (!ctx) {
    return {
      currencyCode: "EUR",
      foodVatPercent: "0",
      locale: "en",
      formatAmount: (amount: string | number) =>
        formatCurrencyAmount(amount, "EUR", "en"),
    };
  }
  return ctx;
}
