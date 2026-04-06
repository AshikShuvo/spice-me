import { auth } from "@/auth";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ProductsOverviewClient } from "@/components/admin/products/products-overview-client";
import { RestaurantProductsClient } from "@/components/admin/products/restaurant-products-client";
import { getAllergyItemsServer } from "@/lib/services/allergy-item-server.service";
import { getCategoriesServer } from "@/lib/services/category-server.service";
import { getProductsAdminServer } from "@/lib/services/product-server.service";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminProductsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const role = session?.user?.role;

  if (role === "RESTAURANT_ADMIN") {
    return <RestaurantProductsClient />;
  }

  let categories;
  let products;
  let allergyItems;
  try {
    [categories, products, allergyItems] = await Promise.all([
      getCategoriesServer(),
      getProductsAdminServer(1, 5),
      getAllergyItemsServer(),
    ]);
  } catch {
    notFound();
  }

  return (
    <ProductsOverviewClient
      initialCategories={categories}
      recentProducts={products.data}
      totalProducts={products.total}
      allergyItems={allergyItems}
    />
  );
}
