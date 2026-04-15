"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function AdminSidebarLogoutButton() {
  const { data: session } = useSession();

  async function handleLogout() {
    const token = session?.accessToken;
    if (token) {
      try {
        await fetch(`${apiUrl}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        /* ignore network errors */
      }
    }
    await signOut({ callbackUrl: "/" });
  }

  return (
    <div className="mt-auto border-t border-coal-20 pt-4">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-center gap-2 border-coal-20 bg-white text-coal hover:bg-light-bg hover:text-peppes-red"
        onClick={() => void handleLogout()}
      >
        <LogOut className="h-4 w-4 shrink-0" aria-hidden />
        Log out
      </Button>
    </div>
  );
}
