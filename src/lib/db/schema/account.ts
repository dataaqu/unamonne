import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { users } from "./auth";

/**
 * Saved shipping addresses for a customer's account (T3.7). An order snapshots
 * its destination inline (`order.ship_*`), so these rows are a convenience for
 * reuse at checkout, not the source of truth for where past orders went —
 * editing or deleting an address never rewrites an order's history.
 *
 * At most one address per user is `isDefault`; the invariant is enforced in the
 * account actions, which clear the flag on the others when one is promoted.
 */
export const addresses = pgTable(
  "address",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    phone: text("phone"),
    country: text("country").notNull(),
    city: text("city").notNull(),
    line1: text("line1").notNull(),
    line2: text("line2"),
    postalCode: text("postal_code"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("address_user_idx").on(t.userId)],
);

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
}));

export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;
