"use client";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { stripLocalePrefix } from "@/lib/i18n-pathname";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/reserve", label: "Reserve" },
  { href: "/design-guide", label: "Design guide" },
] as const;

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
