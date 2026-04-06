"use client";

import { useMemo } from "react";

import { normaliseError } from "@/lib/services/normalise-error";
import type {
  CategoryProfile,
  SubCategoryProfile,
} from "@/lib/types/admin-api";
import { useApiClient } from "@/lib/use-api-client";
import type {
  CreateCategoryInput,
  CreateSubcategoryInput,
  UpdateCategoryInput,
  UpdateSubcategoryInput,
} from "@/lib/validations/category";

export function useCategoryService() {
  const api = useApiClient();

  return useMemo(
    () => ({
      async getCategories(): Promise<CategoryProfile[]> {
        try {
          return await api.get<CategoryProfile[]>("/categories");
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async getCategory(id: string): Promise<CategoryProfile> {
        try {
          return await api.get<CategoryProfile>(`/categories/${id}`);
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async createCategory(dto: CreateCategoryInput): Promise<CategoryProfile> {
        try {
          return await api.post<CategoryProfile>("/categories", dto);
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async updateCategory(
        id: string,
        dto: UpdateCategoryInput,
      ): Promise<CategoryProfile> {
        try {
          return await api.patch<CategoryProfile>(`/categories/${id}`, dto);
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async deleteCategory(id: string): Promise<{ message: string }> {
        try {
          return await api.delete<{ message: string }>(`/categories/${id}`);
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async createSubcategory(
        categoryId: string,
        dto: CreateSubcategoryInput,
      ): Promise<SubCategoryProfile> {
        try {
          return await api.post<SubCategoryProfile>(
            `/categories/${categoryId}/subcategories`,
            dto,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async updateSubcategory(
        categoryId: string,
        subId: string,
        dto: UpdateSubcategoryInput,
      ): Promise<SubCategoryProfile> {
        try {
          return await api.patch<SubCategoryProfile>(
            `/categories/${categoryId}/subcategories/${subId}`,
            dto,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async deleteSubcategory(
        categoryId: string,
        subId: string,
      ): Promise<{ message: string }> {
        try {
          return await api.delete<{ message: string }>(
            `/categories/${categoryId}/subcategories/${subId}`,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },
    }),
    [api],
  );
}
