import { HomeHero } from "@/components/home/home-hero";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="-my-8 flex w-full flex-1 flex-col min-h-0">
      <HomeHero />
    </div>
  );
}
