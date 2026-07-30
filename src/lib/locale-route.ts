import { routing, type Locale } from "@/i18n/routing";

/** next-intl's own cookie, so both sides read and write the same preference. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * The home page is the house's front door and carries no language in its
 * address: `/` is Georgian for a Georgian visitor and English for an English
 * one. Every other page keeps its prefix, so `/en/shop` and `/ka/shop` stay two
 * separate, linkable, indexable pages.
 *
 * These helpers are pure — the proxy and the tests share them.
 */

/** `/ka` and `/en` are the home page under an old address. */
export function bareLocalePath(pathname: string): Locale | null {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}` || pathname === `/${locale}/`) return locale;
  }
  return null;
}

/**
 * Which language `/` should speak: the visitor's own choice first, then what
 * their browser asks for, and the house language if neither says anything.
 */
export function negotiateLocale(
  cookie: string | undefined,
  acceptLanguage: string | null,
): Locale {
  if (isLocale(cookie)) return cookie;

  for (const tag of preferredTags(acceptLanguage)) {
    // `en-GB` and `en` are both English as far as the shop is concerned.
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }

  return routing.defaultLocale;
}

function isLocale(value: string | undefined): value is Locale {
  return (
    value !== undefined && (routing.locales as readonly string[]).includes(value)
  );
}

/** Accept-Language, most wanted first. */
function preferredTags(header: string | null): string[] {
  if (!header) return [];
  return header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="))
        ?.slice(2);
      return { tag: tag.toLowerCase(), q: q === undefined ? 1 : Number(q) };
    })
    .filter((entry) => entry.tag.length > 0 && !Number.isNaN(entry.q))
    .sort((a, b) => b.q - a.q)
    .map((entry) => entry.tag);
}
