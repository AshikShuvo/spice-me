import { Link } from "@/i18n/navigation";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="w-full border-b border-coal-20 bg-lyserosa md:w-56 md:border-b-0 md:border-r">
        <div className="p-4">
          <p className="text-label text-peppes-red">Admin</p>
          <nav className="mt-4 flex flex-col gap-2">
            <Link
              href="/admin/dashboard"
              className="text-body text-coal hover:text-peppes-red"
            >
              Dashboard
            </Link>
            <Link href="/" className="text-body text-neutral-30 hover:text-coal">
              Back to site
            </Link>
          </nav>
        </div>
      </aside>
      <div className="flex-1 bg-light-bg p-6 md:p-10">{children}</div>
    </div>
  );
}
