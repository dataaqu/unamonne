"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { addToCartAction } from "@/lib/cart-actions";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";

import { requireUserId } from "./form";

/**
 * "Buy it again": put a past order's pieces back in the bag and open it.
 *
 * Each line goes through the normal add-to-bag action, so prices are re-read
 * from the catalog and stock is re-checked — a repeat order is a new order at
 * today's terms, never a replay of the old one. A piece that has since sold out
 * or been withdrawn is quietly skipped rather than failing the whole reorder;
 * the bag then shows exactly what is still available.
 */
export async function reorderAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const orderId = String(formData.get("orderId") ?? "");
  const locale = String(formData.get("locale") ?? "ka");
  if (!orderId) return;

  const order = await db.query.orders.findFirst({
    // Scoped to the caller: a forged order id belonging to someone else finds
    // nothing.
    where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
    with: { items: { with: { product: { with: { variants: true } } } } },
  });
  if (!order) return;

  for (const item of order.items) {
    if (!item.productId || !item.product) continue;

    // The line froze the variant's label, not its id — resolve it back, and
    // skip a sized piece whose size no longer exists.
    const variants = item.product.variants;
    const variant = item.variantLabel
      ? variants.find((v) => v.label === item.variantLabel)
      : undefined;
    if (variants.length > 0 && !variant) continue;

    const line = new FormData();
    line.set("productId", item.productId);
    if (variant) line.set("variantId", variant.id);
    if (item.engraving) line.set("engraving", item.engraving);
    line.set("quantity", String(item.quantity));

    await addToCartAction(undefined, line);
  }

  redirect(`/${locale}/cart`);
}
