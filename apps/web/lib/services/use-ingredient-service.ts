"use client";

import { useMemo } from "react";

import { normaliseError } from "@/lib/services/normalise-error";
import type { IngredientProfile } from "@/lib/types/admin-api";
import { useApiClient } from "@/lib/use-api-client";
import type {
  CreateIngredientInput,
  UpdateIngredientInput,
} from "@/lib/validations/ingredient";

export function useIngredientService() {
  const api = useApiClient();

  return useMemo(
    () => ({
      async getIngredients(): Promise<IngredientProfile[]> {
        try {
          return await api.get<IngredientProfile[]>("/ingredients");
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async createIngredient(
        dto: CreateIngredientInput,
      ): Promise<IngredientProfile> {
        try {
          return await api.post<IngredientProfile>("/ingredients", dto);
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async updateIngredient(
        id: string,
        dto: UpdateIngredientInput,
      ): Promise<IngredientProfile> {
        try {
          return await api.patch<IngredientProfile>(`/ingredients/${id}`, dto);
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async deleteIngredient(id: string): Promise<{ message: string }> {
        try {
          return await api.delete<{ message: string }>(`/ingredients/${id}`);
        } catch (e) {
          throw normaliseError(e);
        }
      },
    }),
    [api],
  );
}
