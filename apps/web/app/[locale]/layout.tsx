import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { PlatformCurrencyProvider } from "@/components/platform-currency/platform-currency-context";
import { Providers } from "@/components/providers";
import { fetchPlatformSettingsServer } from "@/lib/fetch-platform-settings";
import { routing } from "@/i18n/routing";
import "../globals.css";

export const metadata: Metadata = {
  title: "spice-me",
  description: "spice-me web application",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();
  const platformSettings = await fetchPlatformSettingsServer();

  return (
    <html lang={locale}>
      <body className="font-ringside-narrow antialiased" suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <PlatformCurrencyProvider initial={platformSettings}>
            <Providers>{children}</Providers>
          </PlatformCurrencyProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
