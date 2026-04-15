import { Header } from "@/components/header/header";
import { PublicRestaurantProvider } from "@/components/public-restaurant/public-restaurant-context";
import type { ReactNode } from "react";

export default function AppLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <PublicRestaurantProvider>
      <div className="flex min-h-screen flex-col w-full justify-around align-middle">
        <Header />
        <main className="mx-auto flex w-full min-h-0 flex-1 flex-col items-center justify-between py-8">
          {children}
        </main>
        <footer className="mx-auto flex w-full flex-col items-center justify-between py-8">
          <p className="text-caption text-coal-60">
            <code className="rounded bg-lyserosa px-1.5 py-0.5">Powered by SpiceMe</code>
          </p>
        </footer>
        {modal}
      </div>
    </PublicRestaurantProvider>
  );
}
