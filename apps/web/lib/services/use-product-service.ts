"use client";

import { useMemo } from "react";

import { normaliseError } from "@/lib/services/normalise-error";
import type { Paginated, ProductProfile } from "@/lib/types/admin-api";
import { useApiClient } from "@/lib/use-api-client";
import type {
  CreateProductInput,
  CreateVariantInput,
  UpdateProductInput,
  UpdateVariantInput,
} from "@/lib/validations/product";

interface ProductListQuery {
  page?: number;
  limit?: number;
  categoryId?: string;
  subCategoryId?: string;
}

export function useProductService() {
  const api = useApiClient();

  return useMemo(
    () => ({
      async getProductsAdmin(
        query: ProductListQuery = {},
      ): Promise<Paginated<ProductProfile>> {
        try {
          const q = new URLSearchParams({
            page: String(query.page ?? 1),
            limit: String(query.limit ?? 20),
          });
          if (query.categoryId) q.set("categoryId", query.categoryId);
          if (query.subCategoryId) q.set("subCategoryId", query.subCategoryId);
          return await api.get<Paginated<ProductProfile>>(
            `/products/all?${q.toString()}`,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async getPublishedProducts(
        query: ProductListQuery = {},
      ): Promise<Paginated<ProductProfile>> {
        try {
          const q = new URLSearchParams({
            page: String(query.page ?? 1),
            limit: String(query.limit ?? 100),
          });
          if (query.categoryId) q.set("categoryId", query.categoryId);
          return await api.get<Paginated<ProductProfile>>(
            `/products?${q.toString()}`,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async getProduct(id: string): Promise<ProductProfile> {
        try {
          return await api.get<ProductProfile>(`/products/${id}`);
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async createProduct(dto: CreateProductInput): Promise<ProductProfile> {
        try {
          return await api.post<ProductProfile>("/products", dto);
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async updateProduct(
        id: string,
        dto: UpdateProductInput,
      ): Promise<ProductProfile> {
        try {
          return await api.patch<ProductProfile>(`/products/${id}`, dto);
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async setPublished(
        id: string,
        isPublished: boolean,
      ): Promise<ProductProfile> {
        try {
          return await api.patch<ProductProfile>(`/products/${id}/publish`, {
            isPublished,
          });
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async deleteProduct(id: string): Promise<{ message: string }> {
        try {
          return await api.delete<{ message: string }>(`/products/${id}`);
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async addVariant(
        productId: string,
        dto: CreateVariantInput,
      ): Promise<ProductProfile> {
        try {
          return await api.post<ProductProfile>(
            `/products/${productId}/variants`,
            dto,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async updateVariant(
        productId: string,
        variantId: string,
        dto: UpdateVariantInput,
      ): Promise<ProductProfile> {
        try {
          return await api.patch<ProductProfile>(
            `/products/${productId}/variants/${variantId}`,
            dto,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async removeVariant(
        productId: string,
        variantId: string,
      ): Promise<ProductProfile> {
        try {
          return await api.delete<ProductProfile>(
            `/products/${productId}/variants/${variantId}`,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async addAllergyItems(
        productId: string,
        allergyItemIds: string[],
      ): Promise<ProductProfile> {
        try {
          return await api.post<ProductProfile>(
            `/products/${productId}/allergy-items`,
            { allergyItemIds },
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },

      async removeAllergyItem(
        productId: string,
        allergyItemId: string,
      ): Promise<ProductProfile> {
        try {
          return await api.delete<ProductProfile>(
            `/products/${productId}/allergy-items/${allergyItemId}`,
          );
        } catch (e) {
          throw normaliseError(e);
        }
      },
    }),
    [api],
  );
}
