import { and, eq, lte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { abandonedCartEmails, cartItems, carts } from "@/lib/db/schema";

/**
 * How long a cart may sit untouched before it counts as abandoned. The recovery
 * cron (T4.3) runs on this window; kept here so the boundary and the query
 * agree on one number.
 */
export const DEFAULT_IDLE_HOURS = 24;

/** The moment a cart must have been idle since to count as abandoned. */
export function abandonmentCutoff(now: Date, idleHours = DEFAULT_IDLE_HOURS): Date {
  return new Date(now.getTime() - idleHours * 60 * 60 * 1000);
}

/**
 * Whether a cart qualifies for a recovery email: still `active` (a converted or
 * already-abandoned cart is done), has items (an empty cart is nothing to
 * recover), and untouched since the cutoff. Pure, so the boundary is testable
 * without a clock or a database.
 */
export function isAbandonmentCandidate(
  cart: { status: string; updatedAt: Date; itemCount: number },
  now: Date,
  idleHours = DEFAULT_IDLE_HOURS,
): boolean {
  return (
    cart.status === "active" &&
    cart.itemCount > 0 &&
    cart.updatedAt <= abandonmentCutoff(now, idleHours)
  );
}

export type AbandonmentCandidate = {
  id: string;
  email: string | null;
  userId: string | null;
  updatedAt: Date;
};

/**
 * Active carts idle since the cutoff that still have at least one item and have
 * never been sent a recovery email. The `has items` and `never emailed`
 * conditions are expressed as SQL EXISTS / NOT EXISTS so the database does the
 * filtering rather than loading empty or already-contacted carts. Ordered
 * oldest-first so the most-neglected carts are recovered first.
 */
export function findAbandonmentCandidates(
  now: Date,
  idleHours = DEFAULT_IDLE_HOURS,
): Promise<AbandonmentCandidate[]> {
  return db
    .select({
      id: carts.id,
      email: carts.email,
      userId: carts.userId,
      updatedAt: carts.updatedAt,
    })
    .from(carts)
    .where(
      and(
        eq(carts.status, "active"),
        lte(carts.updatedAt, abandonmentCutoff(now, idleHours)),
        sql`exists (select 1 from ${cartItems} where ${cartItems.cartId} = ${carts.id})`,
        sql`not exists (select 1 from ${abandonedCartEmails} where ${abandonedCartEmails.cartId} = ${carts.id})`,
      ),
    )
    .orderBy(carts.updatedAt);
}
