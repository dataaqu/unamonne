import { cookies, headers } from "next/headers";

import {
  CURRENCY,
  REGION_COOKIE,
  isRegion,
  regionFromCountry,
  type Region,
} from "@/lib/currency";

// The vocabulary lives in `currency.ts` so Client Components can format a price
// without pulling `next/headers` into the browser bundle; this module adds the
// part that can only run on the server — resolving the active region.
export {
  CURRENCY,
  REGIONS,
  REGION_COOKIE,
  isRegion,
  regionFromCountry,
  type Region,
} from "@/lib/currency";

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
