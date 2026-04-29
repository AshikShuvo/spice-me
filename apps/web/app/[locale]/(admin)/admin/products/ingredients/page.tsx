import { auth } from "@/auth";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { IngredientListClient } from "@/components/admin/products/ingredients/ingredient-list-client";
import { getIngredientsServer } from "@/lib/services/ingredient-server.service";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function IngredientsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect(`/${locale}/admin/dashboard`);
  }

  let items;
  try {
    items = await getIngredientsServer();
  } catch {
    notFound();
  }

  return <IngredientListClient initialData={items} />;
}
