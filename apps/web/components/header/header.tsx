import { Link } from "@/i18n/navigation";
import { PublicRestaurantPicker } from "@/components/public-restaurant/public-restaurant-picker";
import { NavLinks } from "./nav-links";
import { UserMenuButton } from "./user-menu-button";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full flex justify-center align-middle border-b border-coal-10 bg-light-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-4 sm:gap-3">
        <Link href="/" className="shrink-0 text-title font-ringside-compressed text-peppes-red">
          spice-me
        </Link>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-4">
          <NavLinks />
          <PublicRestaurantPicker />
          <UserMenuButton />
        </div>
      </div>
    </header>
  );
}
