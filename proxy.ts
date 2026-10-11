import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, LOCALE_COOKIE, locales } from "@/lib/i18n/config";
import { SESSION_COOKIE } from "@/lib/auth/session";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Two jobs, both optimistic:
 * 1. /admin/* without a session cookie → /admin/login. The real check is requireAdmin() in the layout
 *    and in every Server Action; this only saves a render.
 * 2. Locale routing. English is unprefixed and rewritten to /en/... internally; Bangla is /bn/...;
 *    an explicit /en/... is redirected to its canonical unprefixed form.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (pathname === "/admin/login") return NextResponse.next();
    if (!request.cookies.get(SESSION_COOKIE)?.value) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Canonicalize /en/... → /...
  if (pathname === `/${defaultLocale}` || pathname.startsWith(`/${defaultLocale}/`)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(defaultLocale.length + 1) || "/";
    return NextResponse.redirect(url, 308);
  }

  // Prefixed non-default locale: pass through, remember the choice.
  for (const locale of locales) {
    if (locale === defaultLocale) continue;
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      const response = NextResponse.next();
      response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
      return response;
    }
  }

  // Unprefixed: rewrite into the default-locale segment.
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${defaultLocale}` : `/${defaultLocale}${pathname}`;
  const response = NextResponse.rewrite(url);
  response.cookies.set(LOCALE_COOKIE, defaultLocale, { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
  return response;
}

export const config = {
  matcher: [
    // Everything except API routes, Next internals, static assets and files with an extension.
    "/((?!api|_next|images|files|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\..*).*)",
  ],
};
