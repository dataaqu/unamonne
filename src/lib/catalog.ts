import { routing } from "@/i18n/routing";

/**
 * Pick the translation row matching `locale`, falling back to the default
 * locale, then to the first available row. Used across admin + storefront so
 * content never renders blank when a translation is missing.
 */
export function pickTranslation<T extends { locale: string }>(
  translations: readonly T[],
  locale: string,
): T | undefined {
  return (
    translations.find((t) => t.locale === locale) ??
    translations.find((t) => t.locale === routing.defaultLocale) ??
    translations[0]
  );
}

/**
 * Normalize a string into a URL slug (lowercase, spaces→hyphens, strip unsafe
 * chars). Keeps Unicode letters so Georgian slugs stay readable.
 */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}
