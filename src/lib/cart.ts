import { and, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { cartItems, carts } from "@/lib/db/schema";
import type { Region } from "@/lib/region";

/**
 * Opaque handle for a guest cart. Signed-in shoppers are found by `user_id`
 * instead, but the cookie is kept so a later sign-out still resolves a cart.
 */
export const CART_COOKIE = "CART";

export const CART_COOKIE_OPTIONS = {
  path: "/",
  httpOnly: true,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 365,
} as const;

const withItems = {
  items: {
    with: {
      product: { with: { translations: true, images: true, variants: true } },
      variant: true,
    },
  },
} as const;

export type CartWithItems = NonNullable<
  Awaited<ReturnType<typeof findActiveCartByUser>>
>;
export type CartLine = CartWithItems["items"][number];

/**
 * What makes two bag lines the same line. Size 16 and size 17 of one ring — or
 * the same ring engraved twice with different names — are different lines;
 * re-adding an identical configuration bumps the quantity instead.
 */
export const CART_LINE_KEY = [
  cartItems.cartId,
  cartItems.productId,
  cartItems.variantId,
  cartItems.engraving,
] as const;

/** The signed-in shopper's open cart, if any. */
export function findActiveCartByUser(userId: string) {
  return db.query.carts.findFirst({
    where: and(eq(carts.userId, userId), eq(carts.status, "active")),
    with: withItems,
  });
}

/**
 * An open guest cart for a cookie token. Restricted to unclaimed carts: once a
 * cart has been claimed by a user, a stale cookie must not reopen it.
 */
export function findActiveCartByToken(token: string) {
  return db.query.carts.findFirst({
    where: and(
      eq(carts.token, token),
      eq(carts.status, "active"),
      isNull(carts.userId),
    ),
    with: withItems,
  });
}

/**
 * Attach a guest cart to a user at sign-in. If the user has no cart yet the
 * guest row is simply claimed (cheap, and the cookie token stays valid).
 * Otherwise its lines are folded into the existing cart — quantities add up on
 * conflict — and the emptied guest cart is dropped.
 *
 * Returns the id of the surviving cart, or null when there was nothing to merge.
 */
export async function claimGuestCart(
  userId: string,
  token: string,
): Promise<string | null> {
  const guest = await findActiveCartByToken(token);
  if (!guest) return null;

  const existing = await findActiveCartByUser(userId);

  if (!existing) {
    await db
      .update(carts)
      .set({ userId, updatedAt: new Date() })
      .where(eq(carts.id, guest.id));
    return guest.id;
  }

  if (guest.id === existing.id) return existing.id;

  await db.transaction(async (tx) => {
    for (const line of guest.items) {
      await tx
        .insert(cartItems)
        .values({
          cartId: existing.id,
          productId: line.productId,
          variantId: line.variantId,
          engraving: line.engraving,
          quantity: line.quantity,
          unitPriceGel: line.unitPriceGel,
          unitPriceUsd: line.unitPriceUsd,
        })
        .onConflictDoUpdate({
          target: [...CART_LINE_KEY],
          set: {
            quantity: sql`${cartItems.quantity} + ${line.quantity}`,
            updatedAt: new Date(),
          },
        });
    }
    await tx.delete(carts).where(eq(carts.id, guest.id));
    await tx
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, existing.id));
  });

  return existing.id;
}

/**
 * Unit price of a line in the active region, in minor units. Typed
 * structurally (not as a full `CartLine`) so callers that loaded a lighter
 * shape — the abandoned-cart sweep, an email template — can price it too.
 */
export type PricedLine = {
  quantity: number;
  unitPriceGel: number;
  unitPriceUsd: number;
};

export function lineUnitPrice(line: PricedLine, region: Region): number {
  return region === "GE" ? line.unitPriceGel : line.unitPriceUsd;
}

/**
 * Totals for display. Prices come from the line snapshots taken at add-to-cart
 * time, so a later catalog price edit never changes what a shopper was quoted;
 * both currencies are snapshotted, so switching region is still consistent.
 */
export function cartTotals(
  cart: { items: PricedLine[] } | null,
  region: Region,
): { count: number; subtotal: number } {
  if (!cart) return { count: 0, subtotal: 0 };

  return cart.items.reduce(
    (acc, line) => ({
      count: acc.count + line.quantity,
      subtotal: acc.subtotal + lineUnitPrice(line, region) * line.quantity,
    }),
    { count: 0, subtotal: 0 },
  );
}

/**
 * The sub-line under a bag row: the chosen size and the engraving, e.g.
 * `Size 16 · “ნინო”`. Returns null when a piece has neither, so the row simply
 * omits the line rather than showing an empty one.
 */
export function cartLineVariantLabel(line: {
  variant?: { label: string } | null;
  engraving?: string | null;
}): string | null {
  const parts: string[] = [];
  if (line.variant?.label) parts.push(line.variant.label);
  if (line.engraving) parts.push(`“${line.engraving}”`);
  return parts.length > 0 ? parts.join(" · ") : null;
}
