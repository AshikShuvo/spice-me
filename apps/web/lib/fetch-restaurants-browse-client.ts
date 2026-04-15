const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type RestaurantBrowseItem = {
  id: string;
  name: string;
  code: string;
};

export async function fetchRestaurantsBrowseClient(): Promise<RestaurantBrowseItem[]> {
  const res = await fetch(`${baseUrl}/restaurants/browse`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Restaurants browse failed: ${res.status}`);
  }
  return (await res.json()) as RestaurantBrowseItem[];
}
