import type { MenuResponse } from "@/lib/types/menu-api";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Client-side menu fetch (no Next ISR cache); used when public restaurant context changes. */
export async function fetchMenuPublicClient(
  restaurantCode?: string | null,
): Promise<MenuResponse> {
  const params = new URLSearchParams();
  if (restaurantCode?.trim()) {
    params.set("restaurantCode", restaurantCode.trim());
  }
  const q = params.toString();
  const url = `${baseUrl}/menu${q ? `?${q}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Menu request failed: ${res.status}`);
  }
  return (await res.json()) as MenuResponse;
}
