import type { ProductProfile } from "@/lib/types/admin-api";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function fetchProductPublicServer(
  id: string,
): Promise<
  { ok: true; product: ProductProfile } | { ok: false; status: number }
> {
  try {
    const res = await fetch(`${baseUrl}/products/${encodeURIComponent(id)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return { ok: false, status: res.status };
    }
    const product = (await res.json()) as ProductProfile;
    return { ok: true, product };
  } catch {
    return { ok: false, status: 0 };
  }
}
