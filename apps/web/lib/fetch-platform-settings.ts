import type { PlatformSettingsResponse } from "@/lib/types/platform-settings";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type FetchPlatformSettingsServerOptions = {
  /**
   * Skip Next.js Data Cache. Use for the admin settings editor so reload / `router.refresh()`
   * always reflect the latest API values (otherwise GET is cached ~60s via `revalidate`).
   */
  noStore?: boolean;
};

export async function fetchPlatformSettingsServer(
  options?: FetchPlatformSettingsServerOptions,
): Promise<PlatformSettingsResponse> {
  const fallback: PlatformSettingsResponse = {
    foodVatPercent: "0",
    currencyCode: "EUR",
  };
  try {
    const res = await fetch(`${baseUrl}/platform/settings`, {
      ...(options?.noStore
        ? { cache: "no-store" as const }
        : { next: { revalidate: 60 } }),
    });
    if (!res.ok) {
      return fallback;
    }
    return (await res.json()) as PlatformSettingsResponse;
  } catch {
    return fallback;
  }
}
