import { createServerApiClient } from "@/lib/server-api";
import { normaliseError } from "@/lib/services/normalise-error";
import type {
  Paginated,
  RestaurantAdminAssignmentRow,
  RestaurantProfile,
} from "@/lib/types/admin-api";

export async function getRestaurantsServer(
  page = 1,
  limit = 20,
): Promise<Paginated<RestaurantProfile>> {
  try {
    const api = await createServerApiClient();
    const q = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    return await api.get<Paginated<RestaurantProfile>>(
      `/restaurants?${q.toString()}`,
    );
  } catch (e) {
    throw normaliseError(e);
  }
}

export async function getRestaurantServer(
  id: string,
): Promise<RestaurantProfile> {
  try {
    const api = await createServerApiClient();
    return await api.get<RestaurantProfile>(`/restaurants/${id}`);
  } catch (e) {
    throw normaliseError(e);
  }
}

export async function getRestaurantAdminsServer(
  restaurantId: string,
): Promise<RestaurantAdminAssignmentRow[]> {
  try {
    const api = await createServerApiClient();
    return await api.get<RestaurantAdminAssignmentRow[]>(
      `/restaurants/${restaurantId}/admins`,
    );
  } catch (e) {
    throw normaliseError(e);
  }
}
