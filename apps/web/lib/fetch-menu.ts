import type { MenuResponse } from "@/lib/types/menu-api";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function fetchMenu(
  restaurantCode?: string,
): Promise<{ ok: true; data: MenuResponse } | { ok: false; status: number }> {
  const params = new URLSearchParams();
  if (restaurantCode?.trim()) {
    params.set("restaurantCode", restaurantCode.trim());
  }
  const q = params.toString();
  const url = `${baseUrl}/menu${q ? `?${q}` : ""}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return { ok: false, status: res.status };
    }

    const raw = (await res.json()) as MenuResponse & { currencyCode?: string };
    const data: MenuResponse = {
      ...raw,
      currencyCode: raw.currencyCode ?? "EUR",
    };
    return { ok: true, data };
  } catch {
    return { ok: false, status: 0 };
  }
}
