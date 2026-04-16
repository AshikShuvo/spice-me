"use client";

import { Link } from "@/i18n/navigation";
import { stripLocalePrefix } from "@/lib/i18n-pathname";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

function normalizePath(p: string): string {
  const t = p.replace(/\/$/, "");
  return t === "" ? "/" : t;
}

function isActive(pathname: string, href: string, match: "exact" | "prefix"): boolean {
  const p = normalizePath(pathname);
  const h = normalizePath(href);
  if (match === "exact") {
    return p === h;
  }
  return p === h || p.startsWith(`${h}/`);
}

type Props = {
  href: string;
  children: React.ReactNode;
  /** `exact` = only this path; `prefix` = this path or nested routes (default). */
  match?: "exact" | "prefix";
  className?: string;
};

export function AdminNavLink({
  href,
  children,
  match = "prefix",
  className,
}: Props) {
  const rawPathname = usePathname() ?? "/";
  const pathname = normalizePath(stripLocalePrefix(rawPathname));
  const active = isActive(pathname, href, match);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "text-body transition-colors",
        active
          ? "font-semibold text-peppes-red"
          : "text-coal hover:text-peppes-red",
        className,
      )}
    >
      {children}
    </Link>
  );
}
