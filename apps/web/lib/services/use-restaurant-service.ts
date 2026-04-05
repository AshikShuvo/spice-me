"use client";

import { useMemo } from "react";

import { normaliseError } from "@/lib/services/normalise-error";
import type {
  AssignAdminResponse,
  Paginated,
  RestaurantAdminAssignmentRow,
  RestaurantProfile,
} from "@/lib/types/admin-api";
import { useApiClient } from "@/lib/use-api-client";
import type { CreateRestaurantInput, UpdateRestaurantInput } from "@/lib/validations/restaurant";

export function useRestaurantService() {
  const api = useApiClient();

  return useMemo(
    () => ({
      async getRestaurants(
        page = 1,
        limit = 20,
      ): Promise<Paginated<RestaurantProfile>> {
        try {
          const q = new URLSearchParams({
            page: String(page),
            limit: String(limit),
          });
          return await api.get<Paginated<RestaurantProfile>>(
            `/restaurants?${q.toString()}`,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async getRestaurant(id: string): Promise<RestaurantProfile> {
        try {
          return await api.get<RestaurantProfile>(`/restaurants/${id}`);
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async getRestaurantAdmins(
        restaurantId: string,
      ): Promise<RestaurantAdminAssignmentRow[]> {
        try {
          return await api.get<RestaurantAdminAssignmentRow[]>(
            `/restaurants/${restaurantId}/admins`,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async getMyRestaurants(): Promise<RestaurantProfile[]> {
        try {
          return await api.get<RestaurantProfile[]>("/restaurants/my");
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async createRestaurant(
        dto: CreateRestaurantInput,
      ): Promise<RestaurantProfile> {
        try {
          return await api.post<RestaurantProfile>("/restaurants", dto);
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async updateRestaurant(
        id: string,
        dto: UpdateRestaurantInput,
      ): Promise<RestaurantProfile> {
        try {
          return await api.patch<RestaurantProfile>(
            `/restaurants/${id}`,
            dto,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async updateRestaurantStatus(
        id: string,
        isActive: boolean,
      ): Promise<RestaurantProfile> {
        try {
          return await api.patch<RestaurantProfile>(
            `/restaurants/${id}/status`,
            { isActive },
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async setDefaultRestaurant(id: string): Promise<RestaurantProfile> {
        try {
          return await api.patch<RestaurantProfile>(
            `/restaurants/${id}/default`,
            {},
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async assignAdmin(
        restaurantId: string,
        userId: string,
      ): Promise<AssignAdminResponse> {
        try {
          return await api.post<AssignAdminResponse>(
            `/restaurants/${restaurantId}/admins`,
            { userId },
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async removeAdmin(
        restaurantId: string,
        userId: string,
      ): Promise<{ message: string }> {
        try {
          return await api.delete<{ message: string }>(
            `/restaurants/${restaurantId}/admins/${userId}`,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },
    }),
    [api],
  );
}
