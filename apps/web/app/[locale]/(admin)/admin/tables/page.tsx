import { AdminTablesPageClient } from "@/components/admin/tables/admin-tables-page-client";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminTablesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminTablesPageClient />;
}
