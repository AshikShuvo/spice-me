import { Header } from "@/components/header/header";
import type { ReactNode } from "react";

export default function AppLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col w-full justify-around align-middle">
      <Header />
      <main className="mx-auto flex w-full min-h-0 flex-1 flex-col items-center justify-between py-8">
          {children}
      </main>
      <footer className="w-full flex flex-col py-8 mx-auto items-center justify-between">
        <p className="text-caption text-coal-60">
          Route: <code className="bg-lyserosa px-1.5 py-0.5 rounded">/menu</code>   
        </p>
      </footer>
      {modal}
    </div>
  );
}
