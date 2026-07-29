import { CURRENCY, type Region } from "@/lib/currency";

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

/**
 * Shop-facing price. The house writes ₾1,090 rather than ₾1,090.00 — trailing
 * zeroes are noise on a price list — but keeps the tetri/cents when a price
 * actually has them. Grouping stays Latin in both locales so the numerals line
 * up in tabular columns next to Georgian copy.
 */
export function formatPrice(minorUnits: number, region: Region): string {
  const { symbol } = CURRENCY[region];
  const amount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(minorUnits / 100);
  return `${symbol}${amount}`;
}
