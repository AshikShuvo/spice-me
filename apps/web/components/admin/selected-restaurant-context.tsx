"use client";

import * as React from "react";

import type { RestaurantProfile } from "@/lib/types/admin-api";

const STORAGE_KEY = "spice-me.admin.selectedRestaurantId";

export type SelectedRestaurantContextValue = {
  restaurants: RestaurantProfile[];
  selectedId: string | null;
  selectedRestaurant: RestaurantProfile | null;
  setSelectedId: (id: string) => void;
};

const SelectedRestaurantContext =
  React.createContext<SelectedRestaurantContextValue | null>(null);

export function SelectedRestaurantProvider({
  restaurants,
  children,
}: {
  restaurants: RestaurantProfile[];
  children: React.ReactNode;
}) {
  const [selectedId, setSelectedIdState] = React.useState<string | null>(() =>
    restaurants[0]?.id ?? null,
  );

  React.useEffect(() => {
    if (restaurants.length === 0) {
      setSelectedIdState(null);
      return;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && restaurants.some((r) => r.id === stored)) {
      setSelectedIdState(stored);
      return;
    }
    setSelectedIdState((current) =>
      current && restaurants.some((r) => r.id === current)
        ? current
        : restaurants[0]!.id,
    );
  }, [restaurants]);

  const setSelectedId = React.useCallback((id: string) => {
    setSelectedIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const selectedRestaurant =
    restaurants.find((r) => r.id === selectedId) ?? null;

  const value = React.useMemo(
    (): SelectedRestaurantContextValue => ({
      restaurants,
      selectedId,
      selectedRestaurant,
      setSelectedId,
    }),
    [restaurants, selectedId, selectedRestaurant, setSelectedId],
  );

  return (
    <SelectedRestaurantContext.Provider value={value}>
      {children}
    </SelectedRestaurantContext.Provider>
  );
}

export function useSelectedRestaurant(): SelectedRestaurantContextValue {
  const ctx = React.useContext(SelectedRestaurantContext);
  if (!ctx) {
    throw new Error(
      "useSelectedRestaurant must be used within SelectedRestaurantProvider",
    );
  }
  return ctx;
}
