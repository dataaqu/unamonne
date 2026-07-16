import { defineRouting } from "next-intl/routing";

/**
 * Bilingual routing for the storefront and blog.
 *
 * - `ka` (Georgian) is the default — the shop ships from Georgia.
 * - `localePrefix: "always"` keeps both `/ka/...` and `/en/...` explicit in the
 *   URL, which is what the SEO work in Phase 5 (hreflang, sitemaps) relies on.
 *
 * Region/currency detection (GEL vs USD) is a separate concern handled by the
 * geo layer in T1.5 — locale (language) and region (pricing) are independent.
 */
export const routing = defineRouting({
  locales: ["ka", "en"],
  defaultLocale: "ka",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
