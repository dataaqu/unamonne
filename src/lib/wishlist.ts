import { asc, eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { wishlistItems } from "@/lib/db/schema";
import { WISHLIST_COOKIE } from "@/lib/wishlist-store";

export {
  WISHLIST_COOKIE,
  WISHLIST_COOKIE_OPTIONS,
  claimGuestWishlist,
} from "@/lib/wishlist-store";

/**
 * Who owns the saved pieces on this request. A signed-in shopper is matched by
 * account, a guest by the opaque cookie token — never both, so one visitor can
 * never read another's list.
 */
async function owner() {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const userId = session?.user?.id;
  if (userId) return eq(wishlistItems.userId, userId);

  const token = cookieStore.get(WISHLIST_COOKIE)?.value;
  return token ? eq(wishlistItems.token, token) : null;
}

/** The caller's saved-product ids. Read-only: rendering cannot set a cookie. */
export async function getSavedProductIds(): Promise<Set<string>> {
  try {
    const where = await owner();
    if (!where) return new Set();

    const rows = await db.query.wishlistItems.findMany({
      where,
      columns: { productId: true },
    });
    return new Set(rows.map((row) => row.productId));
  } catch {
    // The heart is decoration when the database is unreachable, not an error.
    return new Set();
  }
}

/** The saved pieces themselves, for the account's saved list. */
export async function getSavedProducts() {
  const where = await owner();
  if (!where) return [];

  const rows = await db.query.wishlistItems.findMany({
    where,
    with: {
      product: { with: { translations: true, images: true, variants: true } },
    },
    orderBy: [asc(wishlistItems.createdAt)],
  });

  return rows
    .filter((row) => row.product && !row.product.isHidden)
    .map((row) => row.product);
}
