import { cookies, headers } from "next/headers";

/**
 * Region drives currency and (later) the available payment method:
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

/**
 * Resolve the active region for the current request. An explicit choice stored
 * in the REGION cookie (set by the proxy on first visit, or by the region
 * switcher in T1.10) wins; otherwise fall back to geo headers.
 */
export async function getRegion(): Promise<Region> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(REGION_COOKIE)?.value;
  if (isRegion(fromCookie)) return fromCookie;

  const requestHeaders = await headers();
  return regionFromCountry(requestHeaders.get("x-vercel-ip-country"));
}

export async function getCurrency() {
  return CURRENCY[await getRegion()];
}
