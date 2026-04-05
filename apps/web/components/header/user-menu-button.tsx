"use client";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { captureAuthReturnPath } from "@/lib/auth-return-path";
import { Link, usePathname } from "@/i18n/navigation";
import { UserRound } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function UserMenuButton() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button variant="ghost" size="icon" className="rounded-full" disabled aria-label="User menu">
        <UserRound className="h-5 w-5" />
      </Button>
    );
  }

  if (!session || !session.user) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full" asChild>
        <Link
          href="/auth/login"
          aria-label="Sign in"
          scroll={false}
          onClick={() => captureAuthReturnPath(pathname)}
        >
          <UserRound className="h-5 w-5" />
        </Link>
      </Button>
    );
  }

  const initials = session.user.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : session.user.email?.slice(0, 2).toUpperCase() ?? "?";

  const accessTokenForLogout = session.accessToken;

  async function handleLogout() {
    const token = accessTokenForLogout;
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label="Account menu"
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem]">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{session.user.name}</p>
            <p className="text-xs leading-none text-coal-60">{session.user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {session.user.role === "ADMIN" ||
        session.user.role === "RESTAURANT_ADMIN" ? (
          <DropdownMenuItem asChild>
            <Link href="/admin/dashboard">Dashboard</Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onClick={() => void handleLogout()}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
