import { and, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { wishlistItems } from "@/lib/db/schema";

/**
 * The saved-pieces store, with no dependency on the auth module.
 *
 * Auth's sign-in event has to claim a guest's saved pieces, and the read
 * helpers in `wishlist.ts` have to know who is signed in — keeping the storage
 * primitives here breaks what would otherwise be an import cycle between the
 * two.
 */

/**
 * Opaque handle for a guest's saved pieces, mirroring the cart cookie: hearts
 * tapped before signing in survive the sign-in, and the row keeps its token
 * afterwards so the unique key stays stable.
 */
export const WISHLIST_COOKIE = "SAVED";

export const WISHLIST_COOKIE_OPTIONS = {
  path: "/",
  httpOnly: true,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 365,
} as const;

/**
 * Attach a guest's saved pieces to a user at sign-in. Rows the user already has
 * are dropped rather than duplicated — the unique key is (token, product), so a
 * straight UPDATE would collide on anything saved from both sides.
 */
export async function claimGuestWishlist(
  userId: string,
  token: string,
): Promise<void> {
  const [guestRows, ownRows] = await Promise.all([
    db.query.wishlistItems.findMany({
      where: and(eq(wishlistItems.token, token), isNull(wishlistItems.userId)),
      columns: { id: true, productId: true },
    }),
    db.query.wishlistItems.findMany({
      where: eq(wishlistItems.userId, userId),
      columns: { productId: true },
    }),
  ]);
  if (guestRows.length === 0) return;

  const owned = new Set(ownRows.map((row) => row.productId));
  const duplicates = guestRows.filter((row) => owned.has(row.productId));
  const fresh = guestRows.filter((row) => !owned.has(row.productId));

  await db.transaction(async (tx) => {
    if (duplicates.length > 0) {
      await tx.delete(wishlistItems).where(
        inArray(
          wishlistItems.id,
          duplicates.map((row) => row.id),
        ),
      );
    }
    if (fresh.length > 0) {
      await tx
        .update(wishlistItems)
        .set({ userId })
        .where(
          inArray(
            wishlistItems.id,
            fresh.map((row) => row.id),
          ),
        );
    }
  });
}
