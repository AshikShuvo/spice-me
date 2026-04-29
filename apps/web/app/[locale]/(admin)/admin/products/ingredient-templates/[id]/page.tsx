import { auth } from "@/auth";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { IngredientTemplateDetailClient } from "@/components/admin/products/ingredient-templates/ingredient-template-detail-client";
import {
  getIngredientTemplateServer,
  getIngredientsServer,
} from "@/lib/services/ingredient-server.service";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function IngredientTemplateDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect(`/${locale}/admin/dashboard`);
  }

  let template;
  let ingredients;
  try {
    [template, ingredients] = await Promise.all([
      getIngredientTemplateServer(id),
      getIngredientsServer(),
    ]);
  } catch {
    notFound();
  }

  return (
    <IngredientTemplateDetailClient template={template} ingredients={ingredients} />
  );
}
