import { auth } from "@/auth";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { SubcategoryListClient } from "@/components/admin/products/subcategories/subcategory-list-client";
import { getCategoriesServer } from "@/lib/services/category-server.service";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SubcategoriesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect(`/${locale}/admin/dashboard`);
  }

  let categories;
  try {
    categories = await getCategoriesServer();
  } catch {
    notFound();
  }

  return <SubcategoryListClient categories={categories} />;
}
