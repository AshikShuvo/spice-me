import { Button } from "@/components/ui/button";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";

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
    <div className="flex w-full flex-col justify-center align-middle items-center gap-8 py-16 text-center">
      <div className="space-y-3">
        <p className="text-label uppercase tracking-widest text-peppes-red">spice-me</p>
        <h1 className="text-display font-ringside-compressed text-coal">
          Pizza &amp; more
        </h1>
        <p className="mx-auto max-w-md text-body-lg text-neutral-30">
          Browse the menu, discover daily specials, and order online — fast.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/menu">View menu</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/design-guide">Design guide</Link>
        </Button>
      </div>
    </div>
  );
}
