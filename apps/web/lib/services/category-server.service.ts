import { createServerApiClient } from "@/lib/server-api";
import { normaliseError } from "@/lib/services/normalise-error";
import type { CategoryProfile } from "@/lib/types/admin-api";

export async function getCategoriesServer(): Promise<CategoryProfile[]> {
  try {
    const api = await createServerApiClient();
    return await api.get<CategoryProfile[]>("/categories");
  } catch (e) {
    throw normaliseError(e);
  }
}

export async function getCategoryServer(id: string): Promise<CategoryProfile> {
  try {
    const api = await createServerApiClient();
    return await api.get<CategoryProfile>(`/categories/${id}`);
  } catch (e) {
    throw normaliseError(e);
  }
}
