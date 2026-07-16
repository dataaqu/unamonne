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
