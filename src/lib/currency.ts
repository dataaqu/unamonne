/**
 * Region and currency, with no server-only imports.
 *
 * `region.ts` resolves the *active* region for a request and therefore reaches
 * for `next/headers`; this module holds only the vocabulary. Keeping them apart
 * means a Client Component can format a price without dragging server APIs into
 * the browser bundle.
 *
 * Region drives currency and the available payment method:
 *   - GE   → GEL (₾), Bank of Georgia iPay
 *   - INTL → USD ($), Stripe
 *
 * Region is independent of language (locale): a visitor can browse in English
 * while paying in GEL, or vice-versa.
 */
export type Region = "GE" | "INTL";

export const REGION_COOKIE = "REGION";

export const CURRENCY = {
  GE: { code: "GEL", symbol: "₾" },
  INTL: { code: "USD", symbol: "$" },
} as const satisfies Record<Region, { code: string; symbol: string }>;

export const REGIONS: readonly Region[] = ["GE", "INTL"];

export function isRegion(value: unknown): value is Region {
  return value === "GE" || value === "INTL";
}

/**
 * Map a Vercel geo country code (`x-vercel-ip-country`) to a shop region.
 * Georgia gets the local region; everything else is treated as international.
 */
export function regionFromCountry(country: string | null | undefined): Region {
  return country?.toUpperCase() === "GE" ? "GE" : "INTL";
}
