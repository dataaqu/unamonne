import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Shop-wide editorial settings, as a small key/value table.
 *
 * The homepage campaign shot is the obvious case: it is a full-bleed
 * photograph that belongs to the season, not to any one product, so sourcing it
 * from a product's gallery would both misattribute it and break the moment that
 * piece sold out and was unfeatured.
 *
 * Deliberately key/value rather than a one-row table with a column per setting:
 * a new editorial slot should not need a migration.
 */
export const siteSettings = pgTable("site_setting", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type NewSiteSetting = typeof siteSettings.$inferInsert;
