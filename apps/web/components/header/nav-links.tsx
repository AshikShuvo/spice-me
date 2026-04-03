import { Link } from "@/i18n/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/design-guide", label: "Design guide" },
] as const;

export function NavLinks() {
  return (
    <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className="text-label text-coal hover:text-peppes-red transition-colors"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
