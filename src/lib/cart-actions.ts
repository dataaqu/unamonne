"use server";

import { and, eq, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  CART_COOKIE,
  CART_COOKIE_OPTIONS,
  CART_LINE_KEY,
  cartTotals,
  claimGuestCart,
  findActiveCartByToken,
  findActiveCartByUser,
} from "@/lib/cart";
import { MAX_ENGRAVING, MAX_QUANTITY } from "@/lib/cart-limits";
import { db } from "@/lib/db";
import { cartItems, carts } from "@/lib/db/schema";
import {
  applyDiscount,
  findDiscountByCode,
  normalizeCode,
} from "@/lib/discounts";
import { getRegion } from "@/lib/region";
import { availableStock, getBuyableProduct } from "@/lib/shop";

export type CartActionState = {
  ok: boolean;
  error?:
    | "INVALID"
    | "NOT_FOUND"
    | "OUT_OF_STOCK"
    | "VARIANT_REQUIRED"
    | "UNKNOWN";
};

export type DiscountActionState = {
  ok: boolean;
  code?: string;
  error?:
    | "INVALID"
    | "NOT_FOUND"
    | "EXPIRED"
    | "USED_UP"
    | "MIN_SUBTOTAL"
    | "UNKNOWN";
};

const addSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).optional(),
  engraving: z.string().trim().max(MAX_ENGRAVING).optional(),
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
 * Add a configuration to the bag. Only ids, a quantity and the engraving text
 * come from the client — prices are read from the catalog server-side and
 * snapshotted onto the line, so a forged form cannot dictate what something
 * costs — and the variant is checked to belong to the product being added.
 */
export async function addToCartAction(
  _prev: CartActionState | undefined,
  formData: FormData,
): Promise<CartActionState> {
  const rawVariant = formData.get("variantId");
  const rawEngraving = formData.get("engraving");

  const parsed = addSchema.safeParse({
    productId: formData.get("productId"),
    variantId: rawVariant ? String(rawVariant) : undefined,
    engraving: rawEngraving ? String(rawEngraving) : undefined,
    quantity: formData.get("quantity") ?? 1,
  });
  if (!parsed.success) return { ok: false, error: "INVALID" };

  try {
    const product = await getBuyableProduct(parsed.data.productId);
    if (!product) return { ok: false, error: "NOT_FOUND" };

    // A piece with sizes cannot be bought "in general".
    if (product.variants.length > 0 && !parsed.data.variantId) {
      return { ok: false, error: "VARIANT_REQUIRED" };
    }
    if (
      parsed.data.variantId &&
      !product.variants.some((v) => v.id === parsed.data.variantId)
    ) {
      return { ok: false, error: "NOT_FOUND" };
    }

    const stock = availableStock(product, parsed.data.variantId);
    if (stock <= 0) return { ok: false, error: "OUT_OF_STOCK" };

    const cart = await getOrCreateCart();
    const engraving = parsed.data.engraving?.length
      ? parsed.data.engraving
      : null;

    // Re-adding the same configuration bumps its quantity, capped at what is
    // actually available.
    await db
      .insert(cartItems)
      .values({
        cartId: cart.id,
        productId: product.id,
        variantId: parsed.data.variantId ?? null,
        engraving,
        quantity: Math.min(parsed.data.quantity, stock),
        unitPriceGel: product.priceGel,
        unitPriceUsd: product.priceUsd,
      })
      .onConflictDoUpdate({
        target: [...CART_LINE_KEY],
        set: {
          quantity: sql`LEAST(${cartItems.quantity} + ${parsed.data.quantity}, ${stock})`,
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
        with: { product: { with: { variants: true } } },
      });
      if (!line) return { ok: false, error: "NOT_FOUND" };

      const stock = availableStock(line.product, line.variantId);
      if (stock <= 0) return { ok: false, error: "OUT_OF_STOCK" };

      await db
        .update(cartItems)
        .set({
          quantity: Math.min(parsed.data.quantity, stock),
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

/** "This is a gift — leave the price off the slip." */
export async function setGiftAction(formData: FormData): Promise<void> {
  const isGift = formData.get("isGift") === "on";
  const cart = await getOwnCart();
  if (!cart) return;

  await db
    .update(carts)
    .set({ isGift, updatedAt: new Date() })
    .where(eq(carts.id, cart.id));

  refresh();
}

/**
 * Apply an offer code. The code is validated against the cart's own subtotal in
 * the active region before it is stored, so the cart never displays a discount
 * it would not actually get — and it is re-validated again at checkout.
 */
export async function applyDiscountAction(
  _prev: DiscountActionState | undefined,
  formData: FormData,
): Promise<DiscountActionState> {
  const raw = String(formData.get("code") ?? "").trim();
  if (!raw) return { ok: false, error: "INVALID" };

  try {
    const [session, cookieStore, region] = await Promise.all([
      auth(),
      cookies(),
      getRegion(),
    ]);
    const userId = session?.user?.id;
    const token = cookieStore.get(CART_COOKIE)?.value;

    const cart = userId
      ? await findActiveCartByUser(userId)
      : token
        ? await findActiveCartByToken(token)
        : null;
    if (!cart) return { ok: false, error: "NOT_FOUND" };

    const discount = await findDiscountByCode(raw);
    if (!discount) return { ok: false, error: "NOT_FOUND" };

    const { subtotal } = cartTotals(cart, region);
    const result = applyDiscount(discount, subtotal, region);
    if (!result.ok) return { ok: false, error: result.reason };

    await db
      .update(carts)
      .set({ discountCode: normalizeCode(raw), updatedAt: new Date() })
      .where(eq(carts.id, cart.id));

    refresh();
    return { ok: true, code: result.code };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
}

export async function removeDiscountAction(): Promise<void> {
  const cart = await getOwnCart();
  if (!cart) return;

  await db
    .update(carts)
    .set({ discountCode: null, updatedAt: new Date() })
    .where(eq(carts.id, cart.id));

  refresh();
}
