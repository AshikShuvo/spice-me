import { MenuBrowseClient } from "@/components/menu/menu-browse-client";
import { fetchMenu } from "@/lib/fetch-menu";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";

/** ISR: regenerate static menu HTML periodically (same cadence as API fetch cache). */
export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string; slug?: string[] }>;
};

function restaurantCodeFromSlug(slug: string[] | undefined): string | undefined {
  if (!slug?.length) return undefined;
  if (slug[0] !== "r") notFound();
  if (slug.length !== 2 || !slug[1]?.trim()) notFound();
  return slug[1]!.trim();
}

/**
 * Pre-render global menu per locale. Optionally pre-render default restaurant when API is up at build time.
 */
export async function generateStaticParams(): Promise<{ slug?: string[] }[]> {
  const paths: { slug?: string[] }[] = [{ slug: undefined }];

  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  try {
    const res = await fetch(`${api}/restaurants/default`, {
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const r = (await res.json()) as { code?: string };
      if (r.code?.trim()) {
        paths.push({ slug: ["r", r.code.trim()] });
      }
    }
  } catch {
    /* build/CI without API — global paths only */
  }

  return paths;
}

export default async function MenuPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("menu");

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  const restaurantCode = restaurantCodeFromSlug(slug);
  const result = await fetchMenu(restaurantCode);

  if (!result.ok) {
    const message =
      result.status === 404
        ? t("restaurant_not_found")
        : t("fetch_error");
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 text-center">
        <h1 className="text-headline font-ringside-compressed text-coal">
          {t("title")}
        </h1>
        <p className="text-body text-neutral-30">{message}</p>
        <Button variant="outline" asChild>
          <Link href="/menu">{t("back_menu")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-2">
      <MenuBrowseClient
        key={`${result.data.scope}-${result.data.restaurant?.code ?? "global"}`}
        menu={result.data}
      />
    </div>
  );
}
