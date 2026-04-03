import createMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuthSecret } from "./lib/auth-env";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const localeMatch = pathname.match(/^\/(en|no)(\/|$)/);
  const locale = localeMatch?.[1] ?? routing.defaultLocale;
  const pathWithoutLocale = pathname.replace(/^\/(en|no)/, "") || "/";

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
    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
