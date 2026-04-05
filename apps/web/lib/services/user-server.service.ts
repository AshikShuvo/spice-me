import { createServerApiClient } from "@/lib/server-api";
import { normaliseError } from "@/lib/services/normalise-error";
import type { Paginated, UserProfile } from "@/lib/types/admin-api";

export async function getUsersServer(
  page = 1,
  limit = 100,
): Promise<Paginated<UserProfile>> {
  try {
    const api = await createServerApiClient();
    const q = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    return await api.get<Paginated<UserProfile>>(`/users?${q.toString()}`);
  } catch (e) {
    throw normaliseError(e);
  }
}
