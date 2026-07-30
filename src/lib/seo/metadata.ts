import { routing } from "@/i18n/routing";
import { appUrl } from "@/lib/email/client";

/**
 * Absolute URL for a locale + a locale-independent path (leading slash, or ""
 * for the home page).
 *
 * Georgian, being the house language, is unprefixed — `/`, `/shop` — and
 * English carries its segment: `/en`, `/en/shop`. Two languages, two addresses,
 * which is the whole basis of the hreflang pairs below.
 */
export function localizedUrl(locale: string, path = ""): string {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${appUrl()}${prefix}${path || (prefix ? "" : "/")}`;
}

/**
 * Canonical + hreflang alternates for a page. `path` is the part after the
 * locale segment (e.g. "/blog/my-post"). Every locale gets a `languages` entry
 * plus `x-default` pointing at the default locale, so Google pairs the two
 * language versions correctly.
 */
export function localizedAlternates(locale: string, path = "") {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = localizedUrl(l, path);
  }
  languages["x-default"] = localizedUrl(routing.defaultLocale, path);

  return {
    canonical: localizedUrl(locale, path),
    languages,
  };
}
