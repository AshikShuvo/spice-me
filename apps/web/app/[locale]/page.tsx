import { Button } from "@repo/ui/button";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import styles from "./page.module.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tHome = await getTranslations("home");
  const tFooter = await getTranslations("footer");

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <ol>
          <li className="text-title">
            {tHome("get_started")}{" "}
            <code>{tHome("edit_file_hint")}</code>
          </li>
          <li>{tHome("save_instant")}</li>
        </ol>

        <div className={styles.ctas}>
          <a
            className={styles.primary}
            href="https://vercel.com/new/clone?demo-description=Learn+to+implement+a+monorepo+with+a+two+Next.js+sites+that+has+installed+three+local+packages.&demo-image=%2F%2Fimages.ctfassets.net%2Fe5382hct74si%2F4K8ZISWAzJ8X1504ca0zmC%2F0b21a1c6246add355e55816278ef54bc%2FBasic.png&demo-title=Monorepo+with+Turborepo&demo-url=https%3A%2F%2Fexamples-basic-web.vercel.sh%2F&from=templates&project-name=Monorepo+with+Turborepo&repository-name=monorepo-turborepo&repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fturborepo%2Ftree%2Fmain%2Fexamples%2Fbasic&root-directory=apps%2Fdocs&skippable-integrations=1&teamSlug=vercel&utm_source=create-turbo"
            target="_blank"
            rel="noopener noreferrer"
          >
            {tHome("deploy")}
          </a>
          <a
            href="https://turborepo.dev/docs?utm_source"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondary}
          >
            {tHome("docs")}
          </a>
        </div>
        <Button
          appName="web"
          className="rounded-full bg-blue-1000 px-5 py-3 text-sm font-medium text-white transition hover:bg-purple-1000"
        >
          {tHome("open_alert")}
        </Button>
        <p className="text-body text-info">{tHome("hello_world")}</p>

        <Link
          href="/design-guide"
          className="inline-flex items-center gap-2 text-label text-peppes-red hover:text-glowing-red transition-colors"
        >
          Design Guide →
        </Link>
      </main>
      <footer className={styles.footer}>
        <a
          href="https://vercel.com/templates?search=turborepo&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          {tFooter("examples")}
        </a>
        <a
          href="https://turborepo.dev?utm_source=create-turbo"
          target="_blank"
          rel="noopener noreferrer"
        >
          {tFooter("turborepo_link")}
        </a>
      </footer>
    </div>
  );
}
