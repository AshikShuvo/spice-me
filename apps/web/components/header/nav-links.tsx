"use client";

import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/design-guide", label: "Design guide" },
] as const;

/** Next.js pathname is `/[locale]/...`; compare using path without locale. */
function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "/";
  const first = segments[0];
  if (routing.locales.includes(first as (typeof routing.locales)[number])) {
    if (segments.length === 1) return "/";
    return `/${segments.slice(1).join("/")}`;
  }
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function pathMatchesNavHref(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/" || pathname === "";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks() {
  const rawPathname = usePathname() ?? "/";
  const pathname = useMemo(
    () => stripLocalePrefix(rawPathname),
    [rawPathname],
  );

  return (
    <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
      {links.map(({ href, label }) => {
        const active = pathMatchesNavHref(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "text-label transition-colors",
              active
                ? "text-primary font-semibold"
                : "text-coal hover:text-primary",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
