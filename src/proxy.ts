import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { isAdminPathname, localeFromPathname } from "@/lib/auth/admin";
import {
  LOCALE_COOKIE,
  bareLocalePath,
  negotiateLocale,
} from "@/lib/locale-route";
import { REGION_COOKIE, isRegion, regionFromCountry } from "@/lib/region";

// Auth.js JWT session cookie names (dev vs. secure production).
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

const YEAR = 60 * 60 * 24 * 365;

/**
 * Locale negotiation + prefixing, plus first-visit region detection.
 *
 * In Next.js 16 the `middleware` file convention was renamed to `proxy`, so
 * next-intl's request handler is wired up here inside the default `proxy`
 * export. It redirects locale-less paths (e.g. `/products`) to the negotiated
 * locale (`/ka/products`) and reads/writes the `NEXT_LOCALE` cookie.
 *
 * The home page is the exception: it is served from `/` in whichever language
 * the visitor reads, so the front door has one clean address instead of two
 * near-identical ones. See `handleHome` below.
 *
 * On the first request we also stamp a `REGION` cookie from Vercel's geo header
 * so currency/payment (GEL/BoG vs USD/Stripe) is decided once and stays stable
 * even if the visitor later switches language.
 */
const handleI18n = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin pre-check: bounce clearly-unauthenticated visitors to login early.
  // This is a UX fast-path only — the authoritative role check lives in the
  // admin layout's server guard (proxy alone must not be trusted for authz).
  if (isAdminPathname(pathname)) {
    const hasSession = SESSION_COOKIES.some((name) =>
      request.cookies.has(name),
    );
    if (!hasSession) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = `/${localeFromPathname(pathname)}/login`;
      loginUrl.search = "";
      return NextResponse.redirect(loginUrl);
    }
  }

  return withRegion(request, handleHome(request) ?? handleI18n(request));
}

/**
 * The two halves of the prefix-free home page.
 *
 * `/` is rewritten — not redirected — onto the locale's own route, so the
 * address bar keeps showing `/` while the page underneath is the ordinary
 * `[locale]` home. `/ka` and `/en` are that same page under their old
 * addresses, so they send the visitor back to `/` and record which language
 * they asked for on the way, which is also how the language switcher works
 * here: it links to `/en`, and the redirect lands on `/` speaking English.
 *
 * Returns null for every other path, which is next-intl's business.
 */
function handleHome(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const locale = negotiateLocale(
      request.cookies.get(LOCALE_COOKIE)?.value,
      request.headers.get("accept-language"),
    );
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    const response = NextResponse.rewrite(url);
    rememberLocale(response, locale);
    return response;
  }

  const bare = bareLocalePath(pathname);
  if (bare) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    const response = NextResponse.redirect(url);
    rememberLocale(response, bare);
    return response;
  }

  return null;
}

function rememberLocale(response: NextResponse, locale: string) {
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: YEAR,
  });
}

function withRegion(request: NextRequest, response: NextResponse) {
  if (!isRegion(request.cookies.get(REGION_COOKIE)?.value)) {
    const region = regionFromCountry(
      request.headers.get("x-vercel-ip-country"),
    );
    response.cookies.set(REGION_COOKIE, region, {
      path: "/",
      sameSite: "lax",
      maxAge: YEAR,
    });
  }
  return response;
}

export const config = {
  // Run on every path except API routes, Next internals, and files with an
  // extension (static assets). Locale-prefixed app routes are matched.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
