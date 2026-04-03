import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MenuPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-2xl space-y-6 text-center">
      <h1 className="text-headline font-ringside-compressed text-coal">Menu</h1>
      <p className="text-body text-neutral-30">
        Browse dishes and categories — coming soon.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="outline" asChild>
          <Link href="/">Back home</Link>
        </Button>
        <Button asChild>
          <Link href="/design-guide">UI components</Link>
        </Button>
      </div>
    </div>
  );
}
