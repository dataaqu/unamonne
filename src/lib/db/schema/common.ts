import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Content locale for translation tables. Keep the values in sync with
 * `routing.locales` in src/i18n/routing.ts (KA/EN).
 */
export const locale = pgEnum("locale", ["ka", "en"]);

/**
 * Shop region, driving currency and payment method. Keep the values in sync
 * with the `Region` union in src/lib/region.ts (GE → GEL/iPay, INTL → USD/Stripe).
 */
export const region = pgEnum("region", ["GE", "INTL"]);

/**
 * Currency of a stored amount. Region maps onto it 1:1 today (GE→GEL,
 * INTL→USD) — see `CURRENCY` in src/lib/region.ts — but amounts are tagged with
 * the currency itself, because a currency is what a rate is actually in.
 */
export const currency = pgEnum("currency", ["GEL", "USD"]);
