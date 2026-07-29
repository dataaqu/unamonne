import { desc, eq } from "drizzle-orm";

import type { CartLine, CartWithItems } from "@/lib/cart";
import { db } from "@/lib/db";
import { carts, orderItems, orders } from "@/lib/db/schema";
import type { Region } from "@/lib/region";
import {
  currencyForRegion,
  normalizeCountry,
  type CurrencyCode,
} from "@/lib/shipping";

/**
 * One priced cart line, both currencies snapshotted, ready to be frozen into an
 * order. Mirrors `cart_item` so a cart maps onto it directly.
 */
export type OrderDraftLine = {
  productId: string | null;
  nameSnapshot: string;
  quantity: number;
  unitPriceGel: number;
  unitPriceUsd: number;
};

/** A line once frozen into the order's single currency. */
export type OrderDraftItem = {
  productId: string | null;
  nameSnapshot: string;
  quantity: number;
  /** Minor units, in the order currency. */
  unitPrice: number;
  /** `unitPrice * quantity`, minor units. */
  lineTotal: number;
};

/**
 * A fully-costed order, not yet persisted. Totals are computed once here so the
 * checkout (T3.5/T3.6) and any test agree on the arithmetic:
 * `total = subtotal + shippingCost + tax`, all minor units.
 */
export type OrderDraft = {
  region: Region;
  currency: CurrencyCode;
  items: OrderDraftItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
};

/**
 * Freeze cart lines into a costed order draft. Each line's unit price is taken
 * from the region's currency snapshot — never re-read from the catalog — so the
 * shopper is charged exactly what they were quoted. Throws on an empty cart:
 * an order with no lines is never valid, and callers should have stopped sooner.
 */
export function buildOrderDraft({
  lines,
  region,
  shippingCost,
  tax = 0,
}: {
  lines: readonly OrderDraftLine[];
  region: Region;
  shippingCost: number;
  tax?: number;
}): OrderDraft {
  if (lines.length === 0) {
    throw new Error("Cannot build an order from an empty cart");
  }

  const currency = currencyForRegion(region);

  const items: OrderDraftItem[] = lines.map((line) => {
    const unitPrice = region === "GE" ? line.unitPriceGel : line.unitPriceUsd;
    return {
      productId: line.productId,
      nameSnapshot: line.nameSnapshot,
      quantity: line.quantity,
      unitPrice,
      lineTotal: unitPrice * line.quantity,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    region,
    currency,
    items,
    subtotal,
    shippingCost,
    tax,
    total: subtotal + shippingCost + tax,
  };
}

/** The line's product name in a locale, falling back to any translation. */
export function cartLineName(line: CartLine, locale: string): string {
  const translations = line.product.translations;
  const match = translations.find((t) => t.locale === locale) ?? translations[0];
  return match?.name ?? "";
}

/** Map a live cart onto order-draft lines, snapshotting the localized name. */
export function orderLinesFromCart(
  cart: CartWithItems,
  locale: string,
): OrderDraftLine[] {
  return cart.items.map((line) => ({
    productId: line.productId,
    nameSnapshot: cartLineName(line, locale),
    quantity: line.quantity,
    unitPriceGel: line.unitPriceGel,
    unitPriceUsd: line.unitPriceUsd,
  }));
}

/**
 * A customer's order history, newest first, with lines. Scoped to `userId` in
 * the query, so it can only ever return that user's own orders (T3.7).
 */
export function findOrdersByUser(userId: string) {
  return db.query.orders.findMany({
    where: eq(orders.userId, userId),
    with: { items: true },
    orderBy: [desc(orders.createdAt)],
  });
}

/**
 * Ownership guard for a single order (order-detail pages). Guest orders
 * (`userId` null) belong to nobody and are never "owned" by a signed-in user.
 */
export function ownsOrder(
  order: { userId: string | null },
  userId: string,
): boolean {
  return order.userId !== null && order.userId === userId;
}

export type ShippingAddressInput = {
  name: string;
  phone?: string | null;
  country: string;
  city: string;
  line1: string;
  line2?: string | null;
  postalCode?: string | null;
};

/**
 * Persist an order from a cart in one transaction: insert the order and its
 * lines, then flip the cart to `converted` (kept, not deleted, for provenance).
 * Returns the new order id. The payment flow (T3.5/T3.6) then drives
 * `paymentStatus` from its webhook. Callers must have a non-empty cart and a
 * resolved shipping cost (see `quoteShipping`).
 */
export async function createOrderFromCart({
  cart,
  region,
  locale,
  email,
  provider,
  shippingCost,
  address,
  tax = 0,
}: {
  cart: CartWithItems;
  region: Region;
  locale: string;
  email: string;
  provider: "ipay" | "stripe";
  shippingCost: number;
  address: ShippingAddressInput;
  tax?: number;
}): Promise<string> {
  const draft = buildOrderDraft({
    lines: orderLinesFromCart(cart, locale),
    region,
    shippingCost,
    tax,
  });

  return db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        userId: cart.userId ?? null,
        cartId: cart.id,
        email,
        region: draft.region,
        currency: draft.currency,
        subtotal: draft.subtotal,
        shippingCost: draft.shippingCost,
        tax: draft.tax,
        total: draft.total,
        paymentProvider: provider,
        shipName: address.name,
        shipPhone: address.phone ?? null,
        shipCountry: normalizeCountry(address.country),
        shipCity: address.city,
        shipLine1: address.line1,
        shipLine2: address.line2 ?? null,
        shipPostalCode: address.postalCode ?? null,
      })
      .returning({ id: orders.id });

    await tx.insert(orderItems).values(
      draft.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        nameSnapshot: item.nameSnapshot,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        currency: draft.currency,
      })),
    );

    await tx
      .update(carts)
      .set({ status: "converted", email, updatedAt: new Date() })
      .where(eq(carts.id, cart.id));

    return order.id;
  });
}
