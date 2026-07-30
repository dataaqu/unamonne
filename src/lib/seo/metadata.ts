import { routing } from "@/i18n/routing";
import { appUrl } from "@/lib/email/client";

/**
 * The home page carries no locale in its address — `/` is served in whichever
 * language the visitor reads (see `src/proxy.ts`). Every other page keeps its
 * prefix.
 */
export function homeUrl(): string {
  return `${appUrl()}/`;
}

/** Absolute URL for a locale + locale-independent path (leading slash). */
export function localizedUrl(locale: string, path = ""): string {
  return path === "" ? homeUrl() : `${appUrl()}/${locale}${path}`;
}

/**
 * Canonical + hreflang alternates for a page. `path` is the part after the
 * locale segment (e.g. "/blog/my-post"). Every locale gets a `languages` entry
 * plus `x-default` pointing at the default locale, so Google pairs the two
 * language versions correctly.
 *
 * The home page is not one of these: both languages live at `/`, so there is no
 * second address to pair it with and it takes `homeUrl()` as a bare canonical.
 */
export function localizedAlternates(locale: string, path: string) {
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
