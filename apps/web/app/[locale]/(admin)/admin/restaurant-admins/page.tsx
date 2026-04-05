import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { RestaurantAdminListClient } from "@/components/admin/restaurant-admins/restaurant-admin-list-client";
import { routing } from "@/i18n/routing";
import { getUsersServer } from "@/lib/services/user-server.service";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminRestaurantAdminsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  let result;
  try {
    result = await getUsersServer(1, 100);
  } catch {
    notFound();
  }

  const restaurantAdmins = result.data.filter((u) => u.role === "RESTAURANT_ADMIN");

  return <RestaurantAdminListClient initialAdmins={restaurantAdmins} />;
}
