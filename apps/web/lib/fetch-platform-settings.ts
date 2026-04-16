import type { PlatformSettingsResponse } from "@/lib/types/platform-settings";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function fetchPlatformSettingsServer(): Promise<PlatformSettingsResponse> {
  const fallback: PlatformSettingsResponse = {
    foodVatPercent: "0",
    currencyCode: "EUR",
  };
  try {
    const res = await fetch(`${baseUrl}/platform/settings`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return fallback;
    }
    return (await res.json()) as PlatformSettingsResponse;
  } catch {
    return fallback;
  }
}
