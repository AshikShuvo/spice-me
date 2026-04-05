import { RestaurantAdminRestaurantSelect } from "@/components/admin/restaurant-admin-restaurant-select";
import { SelectedRestaurantProvider } from "@/components/admin/selected-restaurant-context";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import { getMyRestaurantsServer } from "@/lib/services/restaurant-server.service";
import { canAccessAdminShell } from "@/lib/types/roles";
import type { RestaurantProfile } from "@/lib/types/admin-api";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/auth/login`);
  }

  if (!canAccessAdminShell(session.user.role)) {
    redirect(`/${locale}`);
  }

  const role = session.user.role;
  let myRestaurants: RestaurantProfile[] = [];
  if (role === "RESTAURANT_ADMIN") {
    try {
      myRestaurants = await getMyRestaurantsServer();
    } catch {
      myRestaurants = [];
    }
  }

  return (
    <SelectedRestaurantProvider restaurants={myRestaurants}>
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="w-full border-b border-coal-20 bg-lyserosa md:w-64 md:border-b-0 md:border-r">
          <div className="p-4">
            <p className="text-label text-peppes-red">
              {role === "RESTAURANT_ADMIN" ? "Restaurant" : "Admin"}
            </p>
            {role === "RESTAURANT_ADMIN" ? (
              <RestaurantAdminRestaurantSelect />
            ) : null}
            <nav className="mt-4 flex flex-col gap-2">
              <Link
                href="/admin/dashboard"
                className="text-body text-coal hover:text-peppes-red"
              >
                Dashboard
              </Link>
              {role === "ADMIN" ? (
                <>
                  <Link
                    href="/admin/restaurants"
                    className="text-body text-coal hover:text-peppes-red"
                  >
                    Restaurants
                  </Link>
                  <Link
                    href="/admin/restaurant-admins"
                    className="text-body text-coal hover:text-peppes-red"
                  >
                    Restaurant Admins
                  </Link>
                </>
              ) : null}
              <Link href="/" className="text-body text-neutral-30 hover:text-coal">
                Back to site
              </Link>
            </nav>
          </div>
        </aside>
        <div className="flex-1 bg-light-bg p-6 md:p-10">{children}</div>
      </div>
    </SelectedRestaurantProvider>
  );
}
