import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { RestaurantDetailClient } from "@/components/admin/restaurants/restaurant-detail-client";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  getRestaurantAdminsServer,
  getRestaurantServer,
} from "@/lib/services/restaurant-server.service";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function AdminRestaurantDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  let restaurant;
  let assignments;
  try {
    [restaurant, assignments] = await Promise.all([
      getRestaurantServer(id),
      getRestaurantAdminsServer(id),
    ]);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="h-auto p-0 text-body text-peppes-red" asChild>
        <Link href="/admin/restaurants">← Back to restaurants</Link>
      </Button>
      <RestaurantDetailClient restaurant={restaurant} assignments={assignments} />
    </div>
  );
}
