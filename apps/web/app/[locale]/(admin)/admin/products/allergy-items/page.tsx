import { auth } from "@/auth";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { AllergyItemListClient } from "@/components/admin/products/allergy-items/allergy-item-list-client";
import { getAllergyItemsServer } from "@/lib/services/allergy-item-server.service";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AllergyItemsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect(`/${locale}/admin/dashboard`);
  }

  let items;
  try {
    items = await getAllergyItemsServer();
  } catch {
    notFound();
  }

  return <AllergyItemListClient initialData={items} />;
}
