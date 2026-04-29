"use client";

import { useMemo } from "react";

import { normaliseError } from "@/lib/services/normalise-error";
import type { IngredientTemplateProfile } from "@/lib/types/admin-api";
import { useApiClient } from "@/lib/use-api-client";
import type {
  CreateIngredientTemplateInput,
  UpdateIngredientTemplateInput,
} from "@/lib/validations/ingredient";

export function useIngredientTemplateService() {
  const api = useApiClient();

  return useMemo(
    () => ({
      async getTemplates(): Promise<IngredientTemplateProfile[]> {
        try {
          return await api.get<IngredientTemplateProfile[]>(
            "/ingredient-templates",
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async getTemplate(id: string): Promise<IngredientTemplateProfile> {
        try {
          return await api.get<IngredientTemplateProfile>(
            `/ingredient-templates/${id}`,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async createTemplate(
        dto: CreateIngredientTemplateInput,
      ): Promise<IngredientTemplateProfile> {
        try {
          return await api.post<IngredientTemplateProfile>(
            "/ingredient-templates",
            dto,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async updateTemplate(
        id: string,
        dto: UpdateIngredientTemplateInput,
      ): Promise<IngredientTemplateProfile> {
        try {
          return await api.patch<IngredientTemplateProfile>(
            `/ingredient-templates/${id}`,
            dto,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async deleteTemplate(id: string): Promise<{ message: string }> {
        try {
          return await api.delete<{ message: string }>(
            `/ingredient-templates/${id}`,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },
    }),
    [api],
  );
}
