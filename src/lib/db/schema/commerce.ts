import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { users } from "./auth";
import { products } from "./catalog";
import { currency, region } from "./common";

/**
 * Cart lifecycle. `active` is a cart still being shopped; `converted` is one an
 * order was placed from (kept, not deleted, so orders keep their provenance);
 * `abandoned` is set by the T4.3 cron once a cart goes stale, and drives the
 * offer email in T4.4.
 */
export const cartStatus = pgEnum("cart_status", [
  "active",
  "converted",
  "abandoned",
]);

/**
 * Carts belong to either a signed-in user or an anonymous visitor:
 *   - guests are tracked by `token`, an opaque handle stored in a cookie
 *   - signing in merges the guest cart into the user's cart (T3.2)
 * so `userId` is nullable and `token` is always present. `email` is captured at
 * checkout — for guests it is the only way to reach them for T4.4.
 *
 * `region` records where the cart started, and decides the payment rail at
 * checkout (GE → iPay/GEL, INTL → Stripe/USD). It does not constrain display:
 * because every line snapshots both currencies, the cart renders in whatever
 * region is active, and a price edit still can't move an existing line.
 */
export const carts = pgTable(
  "cart",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    token: text("token")
      .notNull()
      .unique()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    email: text("email"),
    region: region("region").notNull(),
    status: cartStatus("status").notNull().default("active"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("cart_user_idx").on(t.userId),
    // The abandoned-cart sweep (T4.3) scans active carts by staleness.
    index("cart_status_updated_at_idx").on(t.status, t.updatedAt),
  ],
);

/**
 * Line items. Unit prices are snapshotted in BOTH currencies (minor units, as
 * in `product`) at add-to-cart time, so a later price edit never rewrites what
 * a shopper was quoted, and switching region still shows a consistent total.
 */
export const cartItems = pgTable(
  "cart_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    cartId: text("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    unitPriceGel: integer("unit_price_gel").notNull(),
    unitPriceUsd: integer("unit_price_usd").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    // Adding a product already in the cart bumps its quantity instead of
    // creating a second row.
    uniqueIndex("cart_item_cart_product_uq").on(t.cartId, t.productId),
  ],
);

export const cartsRelations = relations(carts, ({ many, one }) => ({
  items: many(cartItems),
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export type Cart = typeof carts.$inferSelect;
export type NewCart = typeof carts.$inferInsert;
export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;

/**
 * Shipping destinations. A zone is matched by ISO-3166 alpha-2 country code;
 * the zone flagged `isFallback` catches everything unlisted, so an order to a
 * country nobody thought to configure still gets a price instead of failing.
 *
 * `isGeorgia` marks the domestic zone (GEL/iPay) as distinct from the
 * international ones (USD/Stripe) — the region split the whole shop is built on.
 */
export const shippingZones = pgTable("shipping_zone", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  countries: text("countries").array().notNull().default([]),
  isGeorgia: boolean("is_georgia").notNull().default(false),
  isFallback: boolean("is_fallback").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

/**
 * Flat rate per zone per currency, in minor units like every other amount.
 * `freeThreshold` is the order subtotal at or above which shipping is free;
 * null means never free.
 */
export const shippingRates = pgTable(
  "shipping_rate",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    zoneId: text("zone_id")
      .notNull()
      .references(() => shippingZones.id, { onDelete: "cascade" }),
    currency: currency("currency").notNull(),
    rate: integer("rate").notNull(),
    freeThreshold: integer("free_threshold"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    // One rate per zone per currency — a second would make the quote ambiguous.
    uniqueIndex("shipping_rate_zone_currency_uq").on(t.zoneId, t.currency),
  ],
);

export const shippingZonesRelations = relations(shippingZones, ({ many }) => ({
  rates: many(shippingRates),
}));

export const shippingRatesRelations = relations(shippingRates, ({ one }) => ({
  zone: one(shippingZones, {
    fields: [shippingRates.zoneId],
    references: [shippingZones.id],
  }),
}));

export type ShippingZone = typeof shippingZones.$inferSelect;
export type NewShippingZone = typeof shippingZones.$inferInsert;
export type ShippingRate = typeof shippingRates.$inferSelect;
export type NewShippingRate = typeof shippingRates.$inferInsert;
