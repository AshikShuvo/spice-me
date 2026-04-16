import { PlatformSettingsForm } from "@/components/admin/platform/platform-settings-form";
import { auth } from "@/auth";
import { fetchPlatformSettingsServer } from "@/lib/fetch-platform-settings";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminPlatformSettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect(`/${locale}/admin/dashboard`);
  }

  const t = await getTranslations("platform_settings");
  const initial = await fetchPlatformSettingsServer();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-headline font-ringside-compressed text-coal">
          {t("title")}
        </h1>
        <p className="text-body text-neutral-30">{t("intro")}</p>
      </div>
      <PlatformSettingsForm initial={initial} />
    </div>
  );
}
