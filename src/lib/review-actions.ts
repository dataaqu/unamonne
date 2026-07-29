"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  orderItems,
  orders,
  productReviews,
  products,
} from "@/lib/db/schema";

export type ReviewState = {
  ok: boolean;
  error?: "UNAUTHENTICATED" | "INVALID" | "NOT_FOUND" | "UNKNOWN";
  fieldErrors?: Record<string, string[]>;
};

const schema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(10, "TOO_SHORT").max(2000, "TOO_LONG"),
  variantLabel: z.string().trim().max(40).optional(),
});

/**
 * Whether this account has actually received this piece. Used to stamp the
 * review as verified — not to gate it, so someone who bought a ring as a gift
 * from another account can still say something.
 */
async function hasPurchased(userId: string, productId: string) {
  const row = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orderItems.productId, productId),
        eq(orders.userId, userId),
        eq(orders.paymentStatus, "paid"),
      ),
    )
    .limit(1);
  return row.length > 0;
}

/**
 * Leave a review. Signed-in only, one per account per piece — the cheapest
 * honest anti-spam rule there is. Re-submitting edits the existing review
 * rather than failing, which is what a shopper who changed their mind expects.
 *
 * The byline is snapshotted from the account at write time, so a later profile
 * rename never silently rewrites an old review.
 */
export async function submitReviewAction(
  _prev: ReviewState | undefined,
  formData: FormData,
): Promise<ReviewState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "UNAUTHENTICATED" };

  const rawVariant = formData.get("variantLabel");
  const parsed = schema.safeParse({
    productId: formData.get("productId") ?? "",
    rating: formData.get("rating") ?? "",
    body: formData.get("body") ?? "",
    variantLabel: rawVariant ? String(rawVariant) : undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "INVALID", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const product = await db.query.products.findFirst({
      where: and(
        eq(products.id, parsed.data.productId),
        eq(products.isHidden, false),
      ),
      columns: { id: true },
    });
    if (!product) return { ok: false, error: "NOT_FOUND" };

    const isVerified = await hasPurchased(userId, product.id);
    const authorName = session.user?.name?.trim() || "Anonymous";

    await db
      .insert(productReviews)
      .values({
        productId: product.id,
        userId,
        authorName,
        rating: parsed.data.rating,
        body: parsed.data.body,
        variantLabel: parsed.data.variantLabel ?? null,
        isVerified,
      })
      .onConflictDoUpdate({
        target: [productReviews.productId, productReviews.userId],
        set: {
          rating: parsed.data.rating,
          body: parsed.data.body,
          variantLabel: parsed.data.variantLabel ?? null,
          isVerified,
          createdAt: new Date(),
        },
      });
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }

  refresh();
  return { ok: true };
}
