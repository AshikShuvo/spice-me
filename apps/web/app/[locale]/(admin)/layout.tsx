import { AdminNavLink } from "@/components/admin/admin-nav-link";
import { AdminSidebarLogoutButton } from "@/components/admin/admin-sidebar-logout-button";
import { RestaurantAdminRestaurantSelect } from "@/components/admin/restaurant-admin-restaurant-select";
import { SelectedRestaurantProvider } from "@/components/admin/selected-restaurant-context";
import { Link } from "@/i18n/navigation";
import { auth } from "@/auth";
import {
  getMyRestaurantsServer,
  getRestaurantsServer,
} from "@/lib/services/restaurant-server.service";
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
  } else if (role === "ADMIN") {
    try {
      const page = await getRestaurantsServer(1, 100);
      myRestaurants = page.data;
    } catch {
      myRestaurants = [];
    }
  }

  return (
    <SelectedRestaurantProvider restaurants={myRestaurants}>
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="flex w-full flex-col border-b border-coal-20 bg-lyserosa md:min-h-screen md:w-64 md:border-b-0 md:border-r">
          <div className="flex min-h-0 flex-1 flex-col p-4">
            <p className="text-label text-peppes-red">
              {role === "RESTAURANT_ADMIN" ? "Restaurant" : "Admin"}
            </p>
            {role === "RESTAURANT_ADMIN" ? (
              <RestaurantAdminRestaurantSelect />
            ) : null}
            <nav className="mt-4 flex min-h-0 flex-1 flex-col gap-2">
              <AdminNavLink href="/admin/dashboard">Dashboard</AdminNavLink>
              {role === "ADMIN" ? (
                <>
                  <AdminNavLink href="/admin/restaurants">Restaurants</AdminNavLink>
                  <AdminNavLink href="/admin/restaurant-admins">
                    Restaurant Admins
                  </AdminNavLink>
                  <AdminNavLink href="/admin/settings">Platform settings</AdminNavLink>
                </>
              ) : null}

              <div className="mt-2 border-t border-coal-20 pt-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-coal/50">
                  Products
                </p>
                {role === "ADMIN" ? (
                  <div className="flex flex-col gap-2">
                    <AdminNavLink href="/admin/products" match="exact">
                      Overview
                    </AdminNavLink>
                    <AdminNavLink href="/admin/products/categories">Categories</AdminNavLink>
                    <AdminNavLink href="/admin/products/subcategories">
                      Sub Categories
                    </AdminNavLink>
                    <AdminNavLink href="/admin/products/allergy-items">
                      Allergy Items
                    </AdminNavLink>
                    <AdminNavLink href="/admin/products/catalog">Products</AdminNavLink>
                  </div>
                ) : (
                  <AdminNavLink href="/admin/products" match="exact">
                    My Products
                  </AdminNavLink>
                )}
              </div>

              {role === "RESTAURANT_ADMIN" ? (
                <AdminNavLink href="/admin/tables">Tables & reservations</AdminNavLink>
              ) : null}

              <Link href="/" className="text-body text-neutral-30 hover:text-coal">
                Back to site
              </Link>
            </nav>
            <AdminSidebarLogoutButton />
          </div>
        </aside>
        <div className="flex-1 bg-light-bg p-6 md:p-10">{children}</div>
      </div>
    </SelectedRestaurantProvider>
  );
}
