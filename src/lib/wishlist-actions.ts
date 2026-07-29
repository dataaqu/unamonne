"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { products, wishlistItems } from "@/lib/db/schema";
import {
  WISHLIST_COOKIE,
  WISHLIST_COOKIE_OPTIONS,
  claimGuestWishlist,
} from "@/lib/wishlist-store";

export type WishlistState = { ok: boolean; saved?: boolean; error?: string };

const schema = z.object({ productId: z.string().min(1) });

/**
 * Toggle a saved piece. A guest gets an opaque cookie on first save (only a
 * Server Action can set one); a signed-in shopper's rows are claimed first, so
 * hearts tapped before logging in are not stranded on the old token.
 */
export async function toggleWishlistAction(
  _prev: WishlistState | undefined,
  formData: FormData,
): Promise<WishlistState> {
  const parsed = schema.safeParse({ productId: formData.get("productId") });
  if (!parsed.success) return { ok: false, error: "INVALID" };

  try {
    const [session, cookieStore] = await Promise.all([auth(), cookies()]);
    const userId = session?.user?.id ?? null;

    let token = cookieStore.get(WISHLIST_COOKIE)?.value;
    if (!token) {
      token = crypto.randomUUID();
      cookieStore.set(WISHLIST_COOKIE, token, WISHLIST_COOKIE_OPTIONS);
    } else if (userId) {
      await claimGuestWishlist(userId, token);
    }

    const product = await db.query.products.findFirst({
      where: and(
        eq(products.id, parsed.data.productId),
        eq(products.isHidden, false),
      ),
      columns: { id: true },
    });
    if (!product) return { ok: false, error: "NOT_FOUND" };

    // Scope by owner: a signed-in shopper owns rows by user id, a guest by
    // token, so one visitor can never toggle another's list.
    const owner = userId
      ? eq(wishlistItems.userId, userId)
      : eq(wishlistItems.token, token);

    const existing = await db.query.wishlistItems.findFirst({
      where: and(owner, eq(wishlistItems.productId, product.id)),
      columns: { id: true },
    });

    if (existing) {
      await db.delete(wishlistItems).where(eq(wishlistItems.id, existing.id));
      refresh();
      return { ok: true, saved: false };
    }

    await db
      .insert(wishlistItems)
      .values({ token, userId, productId: product.id })
      .onConflictDoNothing();

    refresh();
    return { ok: true, saved: true };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
}
