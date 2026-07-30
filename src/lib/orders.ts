import { and, desc, eq, sql } from "drizzle-orm";

import type { CartLine, CartWithItems } from "@/lib/cart";
import { db } from "@/lib/db";
import { carts, orderItems, orders } from "@/lib/db/schema";
import type { OrderFilters } from "@/lib/admin/order-schema";
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
  /** The chosen size / length, frozen alongside the name. */
  variantLabel: string | null;
  engraving: string | null;
  quantity: number;
  unitPriceGel: number;
  unitPriceUsd: number;
};

/** A line once frozen into the order's single currency. */
export type OrderDraftItem = {
  productId: string | null;
  nameSnapshot: string;
  variantLabel: string | null;
  engraving: string | null;
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
  /** Minor units taken off the subtotal by an offer code. Never negative. */
  discountAmount: number;
  shippingCost: number;
  tax: number;
  total: number;
};

/**
 * Freeze cart lines into a costed order draft. Each line's unit price is taken
 * from the region's currency snapshot — never re-read from the catalog — so the
 * shopper is charged exactly what they were quoted. Throws on an empty cart:
 * an order with no lines is never valid, and callers should have stopped sooner.
 *
 * A discount comes off the goods only: it is clamped to the subtotal, so an
 * over-generous code can never pay for shipping or drive a total negative.
 */
export function buildOrderDraft({
  lines,
  region,
  shippingCost,
  discountAmount = 0,
  tax = 0,
}: {
  lines: readonly OrderDraftLine[];
  region: Region;
  shippingCost: number;
  discountAmount?: number;
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
      variantLabel: line.variantLabel,
      engraving: line.engraving,
      quantity: line.quantity,
      unitPrice,
      lineTotal: unitPrice * line.quantity,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const discount = Math.max(0, Math.min(discountAmount, subtotal));

  return {
    region,
    currency,
    items,
    subtotal,
    discountAmount: discount,
    shippingCost,
    tax,
    total: subtotal - discount + shippingCost + tax,
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
    variantLabel: line.variant?.label ?? null,
    engraving: line.engraving,
    quantity: line.quantity,
    unitPriceGel: line.unitPriceGel,
    unitPriceUsd: line.unitPriceUsd,
  }));
}

/**
 * A customer's order history, newest first, with lines. Scoped to `userId` in
 * the query, so it can only ever return that user's own orders (T3.7).
 *
 * Line items carry their product's images so the history can show the piece
 * rather than only its frozen name. The product may be gone (`set null` on
 * delete) — the snapshot on the line is what makes the row printable either way.
 */
export function findOrdersByUser(userId: string) {
  return db.query.orders.findMany({
    where: eq(orders.userId, userId),
    with: { items: { with: { product: { with: { images: true } } } } },
    orderBy: [desc(orders.createdAt)],
  });
}

export type UserOrder = Awaited<ReturnType<typeof findOrdersByUser>>[number];

/** A public order reference, short enough to read down a phone line. */
export function orderReference(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

/** The first catalog image of an order line, or null once the product is gone. */
export function orderItemImage(
  item: UserOrder["items"][number],
): { url: string; alt: string | null } | null {
  const image = [...(item.product?.images ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  )[0];
  return image ? { url: image.url, alt: image.alt } : null;
}

/**
 * Order-history headline figures: how many orders, how much has been spent and
 * how many pieces are actually owned. Only paid orders count towards the last
 * two — a refunded order was unwound, and a pending one has not happened yet.
 *
 * `spent` is summed for one region at a time. An order is charged in the
 * currency frozen on it, and adding GEL to USD would produce a number that is
 * true in no currency at all.
 */
export function orderHistoryStats(
  list: readonly {
    total: number;
    region: Region;
    paymentStatus: string;
    items: readonly { quantity: number }[];
  }[],
  region?: Region,
) {
  const paid = list.filter((order) => order.paymentStatus === "paid");
  return {
    orders: list.length,
    spent: paid
      .filter((order) => region === undefined || order.region === region)
      .reduce((sum, order) => sum + order.total, 0),
    pieces: paid.reduce(
      (sum, order) =>
        sum + order.items.reduce((n, item) => n + item.quantity, 0),
      0,
    ),
  };
}

/**
 * The region a customer's history should be totalled in: the one most of their
 * paid orders were charged in, newest breaking a tie. Reading it off the orders
 * rather than off the active region matters — a shopper browsing in $ who has
 * only ever paid in ₾ must not be told they have spent $0.
 */
export function dominantOrderRegion(
  list: readonly { region: Region; paymentStatus: string }[],
): Region | null {
  const paid = list.filter((order) => order.paymentStatus === "paid");
  if (paid.length === 0) return null;

  const ge = paid.filter((order) => order.region === "GE").length;
  const intl = paid.length - ge;
  if (ge === intl) return paid[0]!.region;
  return ge > intl ? "GE" : "INTL";
}

/** The earliest order in a list (the list itself is newest-first). */
export function firstOrderDate(
  list: readonly { createdAt: Date }[],
): Date | null {
  return list.length > 0 ? list[list.length - 1]!.createdAt : null;
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

/**
 * The admin orders list, newest first, optionally narrowed by payment and/or
 * fulfillment status (T3.8). Both filters combine with AND; no filter returns
 * every order.
 */
export function findOrdersForAdmin(filters: OrderFilters = {}) {
  const conditions = [
    filters.paymentStatus
      ? eq(orders.paymentStatus, filters.paymentStatus)
      : undefined,
    filters.fulfillmentStatus
      ? eq(orders.fulfillmentStatus, filters.fulfillmentStatus)
      : undefined,
  ].filter((c) => c !== undefined);

  return db.query.orders.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: { items: true },
    orderBy: [desc(orders.createdAt)],
  });
}

/**
 * A guest lookup: the printed reference plus the email the order was placed
 * with. Both are required, and the email is what makes this safe to expose —
 * an eight-character reference alone is short enough to guess at, an address
 * paired with it is not.
 */
export function findOrderByReference(reference: string, email: string) {
  const ref = reference.trim().replace(/\s+/g, "").toUpperCase();
  if (ref.length !== 8) return Promise.resolve(undefined);

  return db.query.orders.findFirst({
    where: and(
      sql`upper(left(${orders.id}, 8)) = ${ref}`,
      sql`lower(${orders.email}) = ${email.trim().toLowerCase()}`,
    ),
    with: { items: { with: { product: { with: { images: true } } } } },
  });
}

/** One order with its lines, for the admin detail view and payment webhooks. */
export function findOrderById(id: string) {
  return db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { items: true },
  });
}

/**
 * Mark an order paid — the terminal success state a payment webhook drives
 * (T3.5/T3.6). Idempotent by nature: a provider may deliver the same event more
 * than once, and re-setting `paid` is harmless.
 */
export async function markOrderPaid(orderId: string): Promise<void> {
  await db
    .update(orders)
    .set({ paymentStatus: "paid", updatedAt: new Date() })
    .where(eq(orders.id, orderId));
}

/** Mark an order's payment failed (webhook reported a decline/cancel). */
export async function markOrderFailed(orderId: string): Promise<void> {
  await db
    .update(orders)
    .set({ paymentStatus: "failed", updatedAt: new Date() })
    .where(eq(orders.id, orderId));
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
  discount,
  isGift = false,
  tax = 0,
}: {
  cart: CartWithItems;
  region: Region;
  locale: string;
  email: string;
  provider: "ipay" | "stripe";
  shippingCost: number;
  address: ShippingAddressInput;
  discount?: { code: string; amount: number } | null;
  isGift?: boolean;
  tax?: number;
}): Promise<string> {
  const draft = buildOrderDraft({
    lines: orderLinesFromCart(cart, locale),
    region,
    shippingCost,
    discountAmount: discount?.amount ?? 0,
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
        discountCode: draft.discountAmount > 0 ? (discount?.code ?? null) : null,
        discountAmount: draft.discountAmount,
        shippingCost: draft.shippingCost,
        tax: draft.tax,
        total: draft.total,
        isGift,
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
        variantLabel: item.variantLabel,
        engraving: item.engraving,
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
