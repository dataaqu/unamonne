import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { users } from "./auth";
import { productVariants, products } from "./catalog";
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
    /** "Leave the price off the slip" — carried through onto the order. */
    isGift: boolean("is_gift").notNull().default(false),
    /**
     * The offer code the shopper applied, stored as text rather than as a
     * foreign key: the discount is re-validated and re-priced on every render
     * and again at checkout, so a code that expires mid-session simply stops
     * applying instead of leaving a dangling reference.
     */
    discountCode: text("discount_code"),
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
    /** The chosen size / length / metal. Null for a product without variants. */
    variantId: text("variant_id").references(() => productVariants.id, {
      onDelete: "cascade",
    }),
    /** Free hand-engraving, up to a dozen characters. Null when not requested. */
    engraving: text("engraving"),
    quantity: integer("quantity").notNull().default(1),
    unitPriceGel: integer("unit_price_gel").notNull(),
    unitPriceUsd: integer("unit_price_usd").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    // Re-adding the SAME configuration bumps its quantity instead of creating a
    // second row — but size 16 and size 17, or two different engravings, are
    // genuinely different lines. NULLS NOT DISTINCT so a plain product (no
    // variant, no engraving) still collapses onto one row.
    unique("cart_item_cart_product_uq")
      .on(t.cartId, t.productId, t.variantId, t.engraving)
      .nullsNotDistinct(),
  ],
);

export const cartsRelations = relations(carts, ({ many, one }) => ({
  items: many(cartItems),
  emails: many(abandonedCartEmails),
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
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}));

export type Cart = typeof carts.$inferSelect;
export type NewCart = typeof carts.$inferInsert;
export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;

/**
 * A log of abandoned-cart recovery emails (T4.2/T4.4). One row per send, so the
 * cron (T4.3) can tell an already-contacted cart from a fresh one and never
 * email the same cart twice, and the admin (T4.5) can see the contact history.
 * `offerCode` records the discount code the email carried, if any.
 */
export const abandonedCartEmails = pgTable(
  "abandoned_cart_email",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    cartId: text("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    sentAt: timestamp("sent_at", { mode: "date" }).notNull().defaultNow(),
    offerCode: text("offer_code"),
  },
  (t) => [index("abandoned_cart_email_cart_idx").on(t.cartId)],
);

export const abandonedCartEmailsRelations = relations(
  abandonedCartEmails,
  ({ one }) => ({
    cart: one(carts, {
      fields: [abandonedCartEmails.cartId],
      references: [carts.id],
    }),
  }),
);

export type AbandonedCartEmail = typeof abandonedCartEmails.$inferSelect;
export type NewAbandonedCartEmail = typeof abandonedCartEmails.$inferInsert;

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

/**
 * Which rail settled the order. `ipay` is Bank of Georgia (GEL, T3.5); `stripe`
 * is the international card rail (USD, T3.6). The order records the provider it
 * actually used, so a later region/config change can't rewrite its history.
 */
export const paymentProvider = pgEnum("payment_provider", ["ipay", "stripe"]);

/** Money state of an order, driven by the payment webhook (T3.5/T3.6). */
export const paymentStatus = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
]);

/** Physical state of an order, advanced by the admin (T3.8). */
export const fulfillmentStatus = pgEnum("fulfillment_status", [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

/**
 * A placed order. Money columns are minor units in the order's single
 * `currency` (the one it was paid in), computed once at checkout from cart-line
 * snapshots — `total = subtotal + shippingCost + tax`. `cartId`/`userId` are
 * nullable and set-null on delete so an order outlives the cart it came from and
 * a deleted account: an order is a permanent record, not a live view.
 *
 * The shipping address is SNAPSHOTTED inline (`ship*`) rather than referenced,
 * for the same reason cart lines snapshot prices — where an order shipped must
 * not change when the customer later edits or removes a saved address (T3.7).
 */
export const orders = pgTable(
  "order",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    cartId: text("cart_id").references(() => carts.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    region: region("region").notNull(),
    currency: currency("currency").notNull(),
    subtotal: integer("subtotal").notNull(),
    /** Offer code applied, and what it took off — both frozen at checkout. */
    discountCode: text("discount_code"),
    discountAmount: integer("discount_amount").notNull().default(0),
    shippingCost: integer("shipping_cost").notNull().default(0),
    tax: integer("tax").notNull().default(0),
    total: integer("total").notNull(),
    isGift: boolean("is_gift").notNull().default(false),
    paymentProvider: paymentProvider("payment_provider").notNull(),
    paymentStatus: paymentStatus("payment_status").notNull().default("pending"),
    fulfillmentStatus: fulfillmentStatus("fulfillment_status")
      .notNull()
      .default("pending"),
    shipName: text("ship_name").notNull(),
    shipPhone: text("ship_phone"),
    shipCountry: text("ship_country").notNull(),
    shipCity: text("ship_city").notNull(),
    shipLine1: text("ship_line1").notNull(),
    shipLine2: text("ship_line2"),
    shipPostalCode: text("ship_postal_code"),
    trackingNumber: text("tracking_number"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("order_user_idx").on(t.userId),
    // The admin orders list (T3.8) filters by these.
    index("order_payment_status_idx").on(t.paymentStatus),
    index("order_fulfillment_status_idx").on(t.fulfillmentStatus),
  ],
);

/**
 * Order lines. `nameSnapshot` and `unitPrice` (minor units, in the order's
 * currency) are frozen at checkout, so the line still reads correctly after the
 * product is renamed, repriced, or deleted (`productId` set-null on delete).
 */
export const orderItems = pgTable("order_item", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  nameSnapshot: text("name_snapshot").notNull(),
  /** Frozen alongside the name, for the same reason: "Size 16 · “ნინო”". */
  variantLabel: text("variant_label"),
  engraving: text("engraving"),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  currency: currency("currency").notNull(),
});

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  cart: one(carts, {
    fields: [orders.cartId],
    references: [carts.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

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
