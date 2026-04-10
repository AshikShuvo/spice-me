"use client";

import { useTranslations } from "next-intl";

import { FireHeroBackground } from "@/components/home/fire-hero-background";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export function HomeHero() {
  const t = useTranslations("home");

  return (
    <section
      className="relative left-1/2 flex w-screen max-w-[100vw] min-h-[calc(100dvh-3.5rem)] -translate-x-1/2 flex-1 flex-col overflow-hidden"
    >
      <FireHeroBackground />
      <div className="relative z-10 flex min-h-[calc(100dvh-3.5rem)] flex-1 flex-col items-center justify-center gap-5 px-4 py-12 text-center md:gap-6">
        <p className="text-label uppercase tracking-widest text-peppes-red">
          {t("hero_kicker")}
        </p>
        <h1 className="text-display max-w-[20ch] font-ringside-compressed font-bold leading-tight text-coal md:max-w-none">
          {t("hero_title")}
        </h1>
        <p className="max-w-md text-body-lg text-neutral-30">
          {t("hero_tagline")}
        </p>
        <Button asChild size="lg" className="mt-1 min-w-[11rem] shadow-lg">
          <Link href="/menu">{t("cta_menu")}</Link>
        </Button>
      </div>
    </section>
  );
}
