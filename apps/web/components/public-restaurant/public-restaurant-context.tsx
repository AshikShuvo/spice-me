"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { stripLocalePrefix } from "@/lib/i18n-pathname";

const STORAGE_KEY = "spice-me.public-restaurant-code";

export type PublicRestaurantContextValue = {
  restaurantCode: string | null;
  setRestaurantCode: (code: string | null) => void;
};

const PublicRestaurantContext = React.createContext<PublicRestaurantContextValue | null>(
  null,
);

export function PublicRestaurantProvider({ children }: { children: React.ReactNode }) {
  const rawPathname = usePathname() ?? "/";
  const [restaurantCode, setRestaurantCodeState] = React.useState<string | null>(null);

  const persist = React.useCallback((code: string | null) => {
    try {
      if (code) {
        localStorage.setItem(STORAGE_KEY, code);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setRestaurantCode = React.useCallback(
    (code: string | null) => {
      const next = code?.trim() || null;
      setRestaurantCodeState(next);
      persist(next);
    },
    [persist],
  );

  React.useEffect(() => {
    const stripped = stripLocalePrefix(rawPathname);
    const fromUrlMatch = stripped.match(/^\/menu\/r\/([^/?#]+)/);
    const fromUrl = fromUrlMatch?.[1] ? decodeURIComponent(fromUrlMatch[1]) : null;

    if (fromUrl) {
      setRestaurantCodeState(fromUrl);
      persist(fromUrl);
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)?.trim();
      setRestaurantCodeState(stored || null);
    } catch {
      setRestaurantCodeState(null);
    }
  }, [rawPathname, persist]);

  const value = React.useMemo(
    () => ({ restaurantCode, setRestaurantCode }),
    [restaurantCode, setRestaurantCode],
  );

  return (
    <PublicRestaurantContext.Provider value={value}>{children}</PublicRestaurantContext.Provider>
  );
}

export function usePublicRestaurant(): PublicRestaurantContextValue {
  const ctx = React.useContext(PublicRestaurantContext);
  if (!ctx) {
    throw new Error("usePublicRestaurant must be used within PublicRestaurantProvider");
  }
  return ctx;
}
