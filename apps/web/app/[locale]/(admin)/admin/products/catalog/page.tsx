import { auth } from "@/auth";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { ProductListClient } from "@/components/admin/products/catalog/product-list-client";
import { getCategoriesServer } from "@/lib/services/category-server.service";
import { getProductsAdminServer } from "@/lib/services/product-server.service";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    categoryId?: string;
    subCategoryId?: string;
  }>;
};

export default async function ProductCatalogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect(`/${locale}/admin/dashboard`);
  }

  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const categoryId = sp.categoryId;
  const subCategoryId = sp.subCategoryId;

  let products;
  let categories;
  try {
    [products, categories] = await Promise.all([
      getProductsAdminServer(page, 20, categoryId, subCategoryId),
      getCategoriesServer(),
    ]);
  } catch {
    notFound();
  }

  return (
    <ProductListClient
      initialData={products.data}
      categories={categories}
      page={products.page}
      limit={products.limit}
      total={products.total}
      currentCategoryId={categoryId}
    />
  );
}
