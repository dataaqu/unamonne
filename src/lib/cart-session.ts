import { cookies } from "next/headers";

import { auth } from "@/lib/auth";
import {
  CART_COOKIE,
  findActiveCartByToken,
  findActiveCartByUser,
  type CartWithItems,
} from "@/lib/cart";

/**
 * Resolve the current shopper's cart for rendering. Read-only on purpose: a
 * Server Component cannot set cookies, so this never creates a cart — the
 * add-to-cart action does that (see `getOrCreateCart` in cart-actions).
 *
 * A signed-in user is found by `user_id`; their guest cookie is ignored,
 * because sign-in already claimed the guest cart (`claimGuestCart`).
 */
export async function getCart(): Promise<CartWithItems | null> {
  const session = await auth();
  if (session?.user?.id) {
    return (await findActiveCartByUser(session.user.id)) ?? null;
  }

  const token = (await cookies()).get(CART_COOKIE)?.value;
  if (!token) return null;

  return (await findActiveCartByToken(token)) ?? null;
}

/** Same as `getCart`, but degrades to an empty cart when the DB is unreachable. */
export async function getCartSafely(): Promise<CartWithItems | null> {
  try {
    return await getCart();
  } catch {
    return null;
  }
}
