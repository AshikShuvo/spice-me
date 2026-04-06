import { auth } from "@/auth";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { ProductDetailClient } from "@/components/admin/products/catalog/product-detail-client";
import { getAllergyItemsServer } from "@/lib/services/allergy-item-server.service";
import { getCategoriesServer } from "@/lib/services/category-server.service";
import { getProductServer } from "@/lib/services/product-server.service";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function ProductDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect(`/${locale}/admin/dashboard`);
  }

  let product;
  let categories;
  let allAllergyItems;
  try {
    [product, categories, allAllergyItems] = await Promise.all([
      getProductServer(id),
      getCategoriesServer(),
      getAllergyItemsServer(),
    ]);
  } catch {
    notFound();
  }

  return (
    <ProductDetailClient
      product={product}
      categories={categories}
      allAllergyItems={allAllergyItems}
    />
  );
}
