import { Link } from "@/i18n/navigation";
import { NavLinks } from "./nav-links";
import { UserMenuButton } from "./user-menu-button";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full flex justify-center align-middle border-b border-coal-10 bg-light-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-title font-ringside-compressed text-peppes-red">
          spice-me
        </Link>
        <NavLinks />
        <UserMenuButton />
      </div>
    </header>
  );
}
