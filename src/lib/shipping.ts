import { asc } from "drizzle-orm";

import { db } from "@/lib/db";
import { shippingZones } from "@/lib/db/schema";
import { CURRENCY, type Region } from "@/lib/region";

export type CurrencyCode = (typeof CURRENCY)[Region]["code"];

export type ZoneWithRates = {
  id: string;
  name: string;
  countries: string[];
  isGeorgia: boolean;
  isFallback: boolean;
  rates: {
    currency: string;
    rate: number;
    freeThreshold: number | null;
  }[];
};

export type ShippingQuote = {
  zoneId: string;
  zoneName: string;
  currency: CurrencyCode;
  /** Minor units. Zero when the free threshold is met. */
  cost: number;
  isFree: boolean;
};

/**
 * Every zone with its rates. Name breaks sortOrder ties: without it Postgres is
 * free to reorder rows (an UPDATE physically moves one), which would shuffle an
 * admin list that has Edit/Delete buttons on each row.
 */
export function getShippingZones() {
  return db.query.shippingZones.findMany({
    with: { rates: true },
    orderBy: [asc(shippingZones.sortOrder), asc(shippingZones.name)],
  });
}

/**
 * The subtotal at which shipping stops costing anything in a region, for the
 * announcement bar and the cart's "spend X more" nudge. Reads the domestic zone
 * for Georgia and the fallback zone for everywhere else — the same two zones a
 * shopper in that region will actually be quoted.
 *
 * Null when shipping is not configured, or is never free; both mean the same
 * thing to a caller: say nothing rather than promise something.
 */
export async function getFreeShippingThreshold(
  region: Region,
): Promise<number | null> {
  try {
    const zones = await getShippingZones();
    const zone =
      region === "GE"
        ? zones.find((z) => z.isGeorgia)
        : (zones.find((z) => z.isFallback) ?? zones.find((z) => !z.isGeorgia));
    if (!zone) return null;

    const currency = currencyForRegion(region);
    return zone.rates.find((r) => r.currency === currency)?.freeThreshold ?? null;
  } catch {
    return null;
  }
}

/** Country codes are stored and compared as uppercase ISO-3166 alpha-2. */
export function normalizeCountry(country: string): string {
  return country.trim().toUpperCase();
}

export function currencyForRegion(region: Region): CurrencyCode {
  return CURRENCY[region].code;
}

/**
 * The zone serving a country: an explicit listing wins, otherwise the fallback
 * zone. Null only when no zone matches and none is marked as the fallback,
 * which means shipping is not configured yet.
 */
export function resolveZone(
  zones: readonly ZoneWithRates[],
  country: string,
): ZoneWithRates | null {
  const code = normalizeCountry(country);
  return (
    zones.find((zone) => zone.countries.includes(code)) ??
    zones.find((zone) => zone.isFallback) ??
    null
  );
}

/**
 * Price shipping for a destination. Returns null when the destination has no
 * zone, or the zone has no rate in the region's currency — callers must treat
 * that as "cannot ship here" rather than as free shipping.
 */
export function quoteShipping(
  zones: readonly ZoneWithRates[],
  {
    country,
    region,
    subtotal,
  }: { country: string; region: Region; subtotal: number },
): ShippingQuote | null {
  const zone = resolveZone(zones, country);
  if (!zone) return null;

  const currency = currencyForRegion(region);
  const rate = zone.rates.find((r) => r.currency === currency);
  if (!rate) return null;

  const isFree = rate.freeThreshold !== null && subtotal >= rate.freeThreshold;

  return {
    zoneId: zone.id,
    zoneName: zone.name,
    currency,
    cost: isFree ? 0 : rate.rate,
    isFree,
  };
}
