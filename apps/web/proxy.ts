import createMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuthSecret } from "./lib/auth-env";
import { routing } from "./i18n/routing";
import { canAccessAdminShell } from "./lib/types/roles";

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const localeMatch = pathname.match(/^\/(en|no)(\/|$)/);
  const locale = localeMatch?.[1] ?? routing.defaultLocale;
  const pathWithoutLocale = pathname.replace(/^\/(en|no)/, "") || "/";

  if (pathWithoutLocale === "/menu") {
    const code = request.nextUrl.searchParams.get("restaurantCode")?.trim();
    if (code) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/menu/r/${encodeURIComponent(code)}`;
      url.searchParams.delete("restaurantCode");
      return NextResponse.redirect(url);
    }
  }

  const isProtectedAdminArea =
    pathWithoutLocale.startsWith("/admin") ||
    pathWithoutLocale.startsWith("/dashboard");

  if (isProtectedAdminArea) {
    const token = await getToken({
      req: request,
      secret: getAuthSecret(),
    });
    if (!token) {
      return NextResponse.redirect(
        new URL(`/${locale}/auth/login`, request.url),
      );
    }
    if (!canAccessAdminShell(token.role as string | undefined)) {
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
    if (token.role === "RESTAURANT_ADMIN") {
      const adminOnlyPrefixes = [
        "/admin/restaurants",
        "/admin/restaurant-admins",
      ] as const;
      if (
        adminOnlyPrefixes.some((prefix) => pathWithoutLocale.startsWith(prefix))
      ) {
        return NextResponse.redirect(
          new URL(`/${locale}/admin/dashboard`, request.url),
        );
      }
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
