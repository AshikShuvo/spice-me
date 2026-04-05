"use client";

import { useMemo } from "react";

import { normaliseError } from "@/lib/services/normalise-error";
import type { Paginated, UserProfile } from "@/lib/types/admin-api";
import { useApiClient } from "@/lib/use-api-client";
import type { CreateRestaurantAdminInput } from "@/lib/validations/restaurant";

export function useUserService() {
  const api = useApiClient();

  return useMemo(
    () => ({
      async getUsers(page = 1, limit = 100): Promise<Paginated<UserProfile>> {
        try {
          const q = new URLSearchParams({
            page: String(page),
            limit: String(limit),
          });
          return await api.get<Paginated<UserProfile>>(`/users?${q.toString()}`);
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async createRestaurantAdmin(
        dto: CreateRestaurantAdminInput,
      ): Promise<UserProfile> {
        try {
          return await api.post<UserProfile>("/users/restaurant-admin", dto);
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async softDeleteUser(id: string): Promise<{ message: string }> {
        try {
          return await api.delete<{ message: string }>(`/users/${id}`);
        } catch (e) {
          throw normaliseError(e);
        }
      },
    }),
    [api],
  );
}
