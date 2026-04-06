import { createServerApiClient } from "@/lib/server-api";
import { normaliseError } from "@/lib/services/normalise-error";
import type { Paginated, ProductProfile } from "@/lib/types/admin-api";

export async function getProductsAdminServer(
  page = 1,
  limit = 20,
  categoryId?: string,
  subCategoryId?: string,
): Promise<Paginated<ProductProfile>> {
  try {
    const api = await createServerApiClient();
    const q = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (categoryId) q.set("categoryId", categoryId);
    if (subCategoryId) q.set("subCategoryId", subCategoryId);
    return await api.get<Paginated<ProductProfile>>(
      `/products/all?${q.toString()}`,
    );
  } catch (e) {
    throw normaliseError(e);
  }
}

export async function getProductServer(id: string): Promise<ProductProfile> {
  try {
    const api = await createServerApiClient();
    return await api.get<ProductProfile>(`/products/${id}`);
  } catch (e) {
    throw normaliseError(e);
  }
}
