"use client";

import { useMemo } from "react";

import { normaliseError } from "@/lib/services/normalise-error";
import type { RestaurantTableProfile } from "@/lib/types/admin-api";
import type {
  CreateRestaurantTableInput,
  UpdateRestaurantTableInput,
} from "@/lib/validations/restaurant-tables";
import { useApiClient } from "@/lib/use-api-client";

export function useRestaurantTablesService() {
  const api = useApiClient();

  return useMemo(
    () => ({
      async getTablesPublic(restaurantId: string): Promise<RestaurantTableProfile[]> {
        try {
          return await api.get<RestaurantTableProfile[]>(
            `/restaurants/${restaurantId}/tables`,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async getTablesManage(restaurantId: string): Promise<RestaurantTableProfile[]> {
        try {
          return await api.get<RestaurantTableProfile[]>(
            `/restaurants/${restaurantId}/tables/manage`,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async createTable(
        restaurantId: string,
        dto: CreateRestaurantTableInput,
      ): Promise<RestaurantTableProfile> {
        try {
          const body = {
            tableNumber: dto.tableNumber,
            seatCount: dto.seatCount,
            ...(dto.locationLabel ? { locationLabel: dto.locationLabel } : {}),
            ...(dto.notes ? { notes: dto.notes } : {}),
            ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
          };
          return await api.post<RestaurantTableProfile>(
            `/restaurants/${restaurantId}/tables`,
            body,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async updateTable(
        restaurantId: string,
        tableId: string,
        dto: UpdateRestaurantTableInput,
      ): Promise<RestaurantTableProfile> {
        try {
          return await api.patch<RestaurantTableProfile>(
            `/restaurants/${restaurantId}/tables/${tableId}`,
            dto,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async deleteTable(
        restaurantId: string,
        tableId: string,
      ): Promise<{ message: string }> {
        try {
          return await api.delete<{ message: string }>(
            `/restaurants/${restaurantId}/tables/${tableId}`,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },
    }),
    [api],
  );
}
