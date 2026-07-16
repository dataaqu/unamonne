import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { isAdminPathname, localeFromPathname } from "@/lib/auth/admin";
import { REGION_COOKIE, isRegion, regionFromCountry } from "@/lib/region";

// Auth.js JWT session cookie names (dev vs. secure production).
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

/**
 * Locale negotiation + prefixing, plus first-visit region detection.
 *
 * In Next.js 16 the `middleware` file convention was renamed to `proxy`, so
 * next-intl's request handler is wired up here inside the default `proxy`
 * export. It redirects locale-less paths (e.g. `/products`) to the negotiated
 * locale (`/ka/products`) and reads/writes the `NEXT_LOCALE` cookie.
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

  const response = handleI18n(request);

  if (!isRegion(request.cookies.get(REGION_COOKIE)?.value)) {
    const region = regionFromCountry(
      request.headers.get("x-vercel-ip-country"),
    );
    response.cookies.set(REGION_COOKIE, region, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

export const config = {
  // Run on every path except API routes, Next internals, and files with an
  // extension (static assets). Locale-prefixed app routes are matched.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
