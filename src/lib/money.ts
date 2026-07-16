import { CURRENCY, type Region } from "@/lib/region";

/**
 * Prices are stored in minor units (tetri / cents). Pick the right column for
 * the active region.
 */
export function priceForRegion(
  product: { priceGel: number; priceUsd: number },
  region: Region,
): number {
  return region === "GE" ? product.priceGel : product.priceUsd;
}

const INTL_LOCALE: Record<string, string> = { ka: "ka-GE", en: "en-US" };

/**
 * Format a minor-unit amount as localized currency for a region.
 * e.g. formatMoney(2500, "GE", "ka") → "₾ 25.00"
 */
export function formatMoney(
  minorUnits: number,
  region: Region,
  locale: string,
): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale] ?? "en-US", {
    style: "currency",
    currency: CURRENCY[region].code,
  }).format(minorUnits / 100);
}
