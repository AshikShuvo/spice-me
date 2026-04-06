"use client";

import { useMemo } from "react";

import { normaliseError } from "@/lib/services/normalise-error";
import type { AllergyItemProfile } from "@/lib/types/admin-api";
import { useApiClient } from "@/lib/use-api-client";
import type {
  CreateAllergyItemInput,
  UpdateAllergyItemInput,
} from "@/lib/validations/allergy-item";

export function useAllergyItemService() {
  const api = useApiClient();

  return useMemo(
    () => ({
      async getAllergyItems(): Promise<AllergyItemProfile[]> {
        try {
          return await api.get<AllergyItemProfile[]>("/allergy-items");
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async createAllergyItem(
        dto: CreateAllergyItemInput,
      ): Promise<AllergyItemProfile> {
        try {
          return await api.post<AllergyItemProfile>("/allergy-items", dto);
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async updateAllergyItem(
        id: string,
        dto: UpdateAllergyItemInput,
      ): Promise<AllergyItemProfile> {
        try {
          return await api.patch<AllergyItemProfile>(
            `/allergy-items/${id}`,
            dto,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async deleteAllergyItem(id: string): Promise<{ message: string }> {
        try {
          return await api.delete<{ message: string }>(`/allergy-items/${id}`);
        } catch (e) {
          throw normaliseError(e);
        }
      },
    }),
    [api],
  );
}
