"use client";

import { useMemo } from "react";

import { normaliseError } from "@/lib/services/normalise-error";
import type { RestaurantProductManageRow } from "@/lib/types/admin-api";
import { useApiClient } from "@/lib/use-api-client";

export function useRestaurantProductService() {
  const api = useApiClient();

  return useMemo(
    () => ({
      async getManagedProducts(
        restaurantId: string,
      ): Promise<RestaurantProductManageRow[]> {
        try {
          return await api.get<RestaurantProductManageRow[]>(
            `/restaurants/${restaurantId}/products/manage`,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async addProduct(
        restaurantId: string,
        productId: string,
      ): Promise<RestaurantProductManageRow> {
        try {
          return await api.post<RestaurantProductManageRow>(
            `/restaurants/${restaurantId}/products`,
            { productId },
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async updateAvailability(
        restaurantId: string,
        productId: string,
        isAvailable: boolean,
      ): Promise<RestaurantProductManageRow> {
        try {
          return await api.patch<RestaurantProductManageRow>(
            `/restaurants/${restaurantId}/products/${productId}`,
            { isAvailable },
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async removeProduct(
        restaurantId: string,
        productId: string,
      ): Promise<{ message: string }> {
        try {
          return await api.delete<{ message: string }>(
            `/restaurants/${restaurantId}/products/${productId}`,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },
    }),
    [api],
  );
}
