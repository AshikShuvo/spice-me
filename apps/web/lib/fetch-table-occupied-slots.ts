const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type OccupiedSlot = { startsAt: string; endsAt: string };

export async function fetchTableOccupiedSlotsPublic(
  restaurantId: string,
  tableId: string,
  fromIso: string,
  toIso: string,
): Promise<OccupiedSlot[]> {
  const q = new URLSearchParams({ from: fromIso, to: toIso });
  const res = await fetch(
    `${baseUrl}/restaurants/${restaurantId}/tables/${tableId}/occupied-slots?${q.toString()}`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    throw new Error(`Occupied slots request failed: ${res.status}`);
  }
  const data = (await res.json()) as { slots: OccupiedSlot[] };
  return data.slots ?? [];
}
