import { createServerApiClient } from "@/lib/server-api";
import { normaliseError } from "@/lib/services/normalise-error";
import type { AllergyItemProfile } from "@/lib/types/admin-api";

export async function getAllergyItemsServer(): Promise<AllergyItemProfile[]> {
  try {
    const api = await createServerApiClient();
    return await api.get<AllergyItemProfile[]>("/allergy-items");
  } catch (e) {
    throw normaliseError(e);
  }
}
