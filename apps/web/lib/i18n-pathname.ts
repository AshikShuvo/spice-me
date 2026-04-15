import { routing } from "@/i18n/routing";

/** Next.js pathname is `/[locale]/...`; compare using path without locale. */
export function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "/";
  const first = segments[0];
  if (routing.locales.includes(first as (typeof routing.locales)[number])) {
    if (segments.length === 1) return "/";
    return `/${segments.slice(1).join("/")}`;
  }
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}
