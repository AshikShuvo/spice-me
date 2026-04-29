import { createServerApiClient } from "@/lib/server-api";
import { normaliseError } from "@/lib/services/normalise-error";
import type {
  IngredientProfile,
  IngredientTemplateProfile,
} from "@/lib/types/admin-api";

export async function getIngredientsServer(): Promise<IngredientProfile[]> {
  try {
    const api = await createServerApiClient();
    return await api.get<IngredientProfile[]>("/ingredients");
  } catch (e) {
    throw normaliseError(e);
  }
}

export async function getIngredientTemplatesServer(): Promise<
  IngredientTemplateProfile[]
> {
  try {
    const api = await createServerApiClient();
    return await api.get<IngredientTemplateProfile[]>("/ingredient-templates");
  } catch (e) {
    throw normaliseError(e);
  }
}

export async function getIngredientTemplateServer(
  id: string,
): Promise<IngredientTemplateProfile> {
  try {
    const api = await createServerApiClient();
    return await api.get<IngredientTemplateProfile>(
      `/ingredient-templates/${id}`,
    );
  } catch (e) {
    throw normaliseError(e);
  }
}
