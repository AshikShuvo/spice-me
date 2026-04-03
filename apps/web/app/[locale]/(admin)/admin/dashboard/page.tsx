import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminDashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-4">
      <h1 className="text-headline font-ringside-compressed text-coal">Dashboard</h1>
      <p className="text-body text-neutral-30">
        Restaurant administration — products, orders, and settings will live here.
      </p>
    </div>
  );
}
