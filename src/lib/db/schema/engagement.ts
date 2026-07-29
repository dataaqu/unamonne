import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { users } from "./auth";
import { productVariants, products } from "./catalog";
import { locale } from "./common";

/**
 * Saved pieces — the heart on a product card. Modelled exactly like the cart:
 * an anonymous visitor is tracked by an opaque cookie `token`, and signing in
 * claims those rows onto the account, so a list built before logging in is not
 * lost. `token` stays on the row afterwards, which keeps the unique key stable.
 */
export const wishlistItems = pgTable(
  "wishlist_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    token: text("token").notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    // Saving the same piece twice is a no-op, not a second row.
    uniqueIndex("wishlist_item_token_product_uq").on(t.token, t.productId),
    index("wishlist_item_user_idx").on(t.userId),
  ],
);

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  product: one(products, {
    fields: [wishlistItems.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [wishlistItems.userId],
    references: [users.id],
  }),
}));

/**
 * "Notify me when it is back" on a sold-out piece or size. `notifiedAt` is set
 * when the mail goes out, so a restock never mails the same person twice, and
 * the row is kept as a demand signal for the studio.
 */
export const backInStockRequests = pgTable(
  "back_in_stock_request",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: text("variant_id").references(() => productVariants.id, {
      onDelete: "cascade",
    }),
    email: text("email").notNull(),
    locale: locale("locale").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    notifiedAt: timestamp("notified_at", { mode: "date" }),
  },
  (t) => [
    // One open request per address per size. NULLS NOT DISTINCT so a product
    // without variants (variant_id null) still collapses to a single row.
    unique("back_in_stock_product_variant_email_uq")
      .on(t.productId, t.variantId, t.email)
      .nullsNotDistinct(),
    index("back_in_stock_pending_idx").on(t.productId, t.notifiedAt),
  ],
);

export const backInStockRequestsRelations = relations(
  backInStockRequests,
  ({ one }) => ({
    product: one(products, {
      fields: [backInStockRequests.productId],
      references: [products.id],
    }),
    variant: one(productVariants, {
      fields: [backInStockRequests.variantId],
      references: [productVariants.id],
    }),
  }),
);

/**
 * Newsletter list. `unsubscribedAt` soft-deletes rather than removing the row,
 * so a one-click unsubscribe is permanent — re-subscribing is an explicit act
 * that clears the timestamp, and a re-import can never resurrect someone who
 * opted out.
 */
export const newsletterSubscribers = pgTable(
  "newsletter_subscriber",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull().unique(),
    locale: locale("locale").notNull(),
    /** Where they signed up: "home", "journal", "checkout". */
    source: text("source"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    unsubscribedAt: timestamp("unsubscribed_at", { mode: "date" }),
  },
  (t) => [index("newsletter_subscriber_active_idx").on(t.unsubscribedAt)],
);

/**
 * Offer codes for the cart (and the abandoned-cart recovery mails, which
 * already carry an `offerCode` column).
 *
 * A code is either a percentage OR a fixed amount per currency — never both.
 * Fixed amounts are stored once per currency in minor units, for the same
 * reason product prices are: a live FX conversion would make the discount a
 * different size depending on when the shopper looked.
 */
export const discountCodes = pgTable(
  "discount_code",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /** Stored uppercase; lookups uppercase the input. */
    code: text("code").notNull().unique(),
    percentOff: integer("percent_off"),
    amountOffGel: integer("amount_off_gel"),
    amountOffUsd: integer("amount_off_usd"),
    minSubtotalGel: integer("min_subtotal_gel"),
    minSubtotalUsd: integer("min_subtotal_usd"),
    isActive: boolean("is_active").notNull().default(true),
    startsAt: timestamp("starts_at", { mode: "date" }),
    expiresAt: timestamp("expires_at", { mode: "date" }),
    maxRedemptions: integer("max_redemptions"),
    redemptions: integer("redemptions").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("discount_code_active_idx").on(t.isActive)],
);

export type WishlistItem = typeof wishlistItems.$inferSelect;
export type NewWishlistItem = typeof wishlistItems.$inferInsert;
export type BackInStockRequest = typeof backInStockRequests.$inferSelect;
export type NewBackInStockRequest = typeof backInStockRequests.$inferInsert;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type NewNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;
export type DiscountCode = typeof discountCodes.$inferSelect;
export type NewDiscountCode = typeof discountCodes.$inferInsert;
