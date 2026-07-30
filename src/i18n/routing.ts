import { defineRouting } from "next-intl/routing";

/**
 * Bilingual routing for the storefront and blog.
 *
 * - `ka` (Georgian) is the default — the shop ships from Georgia — and it is
 *   the language of the bare address: `/`, `/shop`, `/blog`.
 * - English lives one segment in: `/en`, `/en/shop`, `/en/blog`.
 *
 * `localePrefix: "as-needed"` is what produces that pair, and it keeps the two
 * languages on two distinct addresses, which is what the SEO work in Phase 5
 * (hreflang, sitemaps) relies on — a crawler carries no language cookie, so
 * every page has to say which language it is by its URL alone. Requests that
 * still carry `/ka` are redirected to the bare path so there is one address per
 * page rather than two.
 *
 * Region/currency detection (GEL vs USD) is a separate concern handled by the
 * geo layer in T1.5 — locale (language) and region (pricing) are independent.
 */
export const routing = defineRouting({
  locales: ["ka", "en"],
  defaultLocale: "ka",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
