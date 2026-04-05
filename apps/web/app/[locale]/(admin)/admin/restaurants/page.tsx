import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { RestaurantListClient } from "@/components/admin/restaurants/restaurant-list-client";
import { routing } from "@/i18n/routing";
import { getRestaurantsServer } from "@/lib/services/restaurant-server.service";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function AdminRestaurantsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const limit = 20;

  let result;
  try {
    result = await getRestaurantsServer(page, limit);
  } catch {
    notFound();
  }

  return (
    <RestaurantListClient
      initialData={result.data}
      page={result.page}
      limit={result.limit}
      total={result.total}
    />
  );
}
