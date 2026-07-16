"use server";

import { and, eq, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  CART_COOKIE,
  CART_COOKIE_OPTIONS,
  claimGuestCart,
  findActiveCartByToken,
  findActiveCartByUser,
} from "@/lib/cart";
import { db } from "@/lib/db";
import { cartItems, carts, products } from "@/lib/db/schema";
import { getRegion } from "@/lib/region";

export type CartActionState = {
  ok: boolean;
  error?: "INVALID" | "NOT_FOUND" | "OUT_OF_STOCK" | "UNKNOWN";
};

const MAX_QUANTITY = 99;

const addSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(MAX_QUANTITY).default(1),
});

const setQuantitySchema = z.object({
  itemId: z.string().min(1),
  // 0 removes the line, which is what a quantity stepper hitting zero means.
  quantity: z.coerce.number().int().min(0).max(MAX_QUANTITY),
});

const removeSchema = z.object({ itemId: z.string().min(1) });

/**
 * The cart to mutate, creating one if needed. Only callable from a Server
 * Action: it may set the guest cookie, which rendering cannot do.
 *
 * Signing in claims any guest cart first, so a shopper who filled a cart
 * anonymously and then logged in keeps their items.
 */
async function getOrCreateCart(): Promise<{ id: string }> {
  const [session, cookieStore, region] = await Promise.all([
    auth(),
    cookies(),
    getRegion(),
  ]);
  const token = cookieStore.get(CART_COOKIE)?.value;
  const userId = session?.user?.id;

  if (userId) {
    if (token) await claimGuestCart(userId, token);

    const existing = await findActiveCartByUser(userId);
    if (existing) return existing;

    const newToken = crypto.randomUUID();
    const [created] = await db
      .insert(carts)
      .values({ token: newToken, userId, region })
      .returning({ id: carts.id });
    cookieStore.set(CART_COOKIE, newToken, CART_COOKIE_OPTIONS);
    return created;
  }

  if (token) {
    const existing = await findActiveCartByToken(token);
    if (existing) return existing;
  }

  const newToken = crypto.randomUUID();
  const [created] = await db
    .insert(carts)
    .values({ token: newToken, region })
    .returning({ id: carts.id });
  cookieStore.set(CART_COOKIE, newToken, CART_COOKIE_OPTIONS);
  return created;
}

/** The caller's cart, without creating one. Used to scope mutations by owner. */
async function getOwnCart(): Promise<{ id: string } | null> {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const userId = session?.user?.id;

  if (userId) return (await findActiveCartByUser(userId)) ?? null;

  const token = cookieStore.get(CART_COOKIE)?.value;
  if (!token) return null;
  return (await findActiveCartByToken(token)) ?? null;
}

function touchCart(cartId: string) {
  return db
    .update(carts)
    .set({ updatedAt: new Date() })
    .where(eq(carts.id, cartId));
}

/**
 * Add a product to the cart. Only the product id and quantity come from the
 * client — prices are read from the catalog server-side and snapshotted onto
 * the line, so a forged form cannot dictate what something costs.
 */
export async function addToCartAction(
  _prev: CartActionState | undefined,
  formData: FormData,
): Promise<CartActionState> {
  const parsed = addSchema.safeParse({
    productId: formData.get("productId"),
    quantity: formData.get("quantity") ?? 1,
  });
  if (!parsed.success) return { ok: false, error: "INVALID" };

  try {
    const product = await db.query.products.findFirst({
      where: and(
        eq(products.id, parsed.data.productId),
        eq(products.isHidden, false),
      ),
    });
    if (!product) return { ok: false, error: "NOT_FOUND" };
    if (product.isOutOfStock || product.stock <= 0) {
      return { ok: false, error: "OUT_OF_STOCK" };
    }

    const cart = await getOrCreateCart();

    // Re-adding a product bumps its quantity (unique on cart+product), capped
    // at what is actually in stock.
    await db
      .insert(cartItems)
      .values({
        cartId: cart.id,
        productId: product.id,
        quantity: Math.min(parsed.data.quantity, product.stock),
        unitPriceGel: product.priceGel,
        unitPriceUsd: product.priceUsd,
      })
      .onConflictDoUpdate({
        target: [cartItems.cartId, cartItems.productId],
        set: {
          quantity: sql`LEAST(${cartItems.quantity} + ${parsed.data.quantity}, ${product.stock})`,
          updatedAt: new Date(),
        },
      });

    await touchCart(cart.id);
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }

  refresh();
  return { ok: true };
}

/** Change a line's quantity; zero removes it. Scoped to the caller's own cart. */
export async function setQuantityAction(
  _prev: CartActionState | undefined,
  formData: FormData,
): Promise<CartActionState> {
  const parsed = setQuantitySchema.safeParse({
    itemId: formData.get("itemId"),
    quantity: formData.get("quantity"),
  });
  if (!parsed.success) return { ok: false, error: "INVALID" };

  try {
    const cart = await getOwnCart();
    if (!cart) return { ok: false, error: "NOT_FOUND" };

    const owned = and(
      eq(cartItems.id, parsed.data.itemId),
      eq(cartItems.cartId, cart.id),
    );

    if (parsed.data.quantity === 0) {
      await db.delete(cartItems).where(owned);
    } else {
      const line = await db.query.cartItems.findFirst({
        where: owned,
        with: { product: true },
      });
      if (!line) return { ok: false, error: "NOT_FOUND" };

      await db
        .update(cartItems)
        .set({
          quantity: Math.min(parsed.data.quantity, line.product.stock),
          updatedAt: new Date(),
        })
        .where(owned);
    }

    await touchCart(cart.id);
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }

  refresh();
  return { ok: true };
}

/** Remove a line. Scoped to the caller's own cart. */
export async function removeItemAction(
  _prev: CartActionState | undefined,
  formData: FormData,
): Promise<CartActionState> {
  const parsed = removeSchema.safeParse({ itemId: formData.get("itemId") });
  if (!parsed.success) return { ok: false, error: "INVALID" };

  try {
    const cart = await getOwnCart();
    if (!cart) return { ok: false, error: "NOT_FOUND" };

    await db
      .delete(cartItems)
      .where(
        and(eq(cartItems.id, parsed.data.itemId), eq(cartItems.cartId, cart.id)),
      );
    await touchCart(cart.id);
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }

  refresh();
  return { ok: true };
}
