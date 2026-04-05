import { RestaurantAdminDashboardSummary } from "@/components/admin/restaurant-admin-dashboard-summary";
import { auth } from "@/auth";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminDashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const isRestaurantAdmin = session?.user?.role === "RESTAURANT_ADMIN";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-headline font-ringside-compressed text-coal">Dashboard</h1>
        <p className="text-body text-neutral-30">
          {isRestaurantAdmin
            ? "Manage your assigned location. Orders and analytics will appear here soon."
            : "Restaurant administration — products, orders, and settings will live here."}
        </p>
      </div>
      {isRestaurantAdmin ? <RestaurantAdminDashboardSummary /> : null}
    </div>
  );
}
