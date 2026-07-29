"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { routing } from "@/i18n/routing";
import { db } from "@/lib/db";
import {
  backInStockRequests,
  productVariants,
  products,
} from "@/lib/db/schema";

export type BackInStockState = {
  ok: boolean;
  error?: "EMAIL_INVALID" | "NOT_FOUND" | "UNKNOWN";
};

const schema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).optional(),
  email: z.string().trim().toLowerCase().pipe(z.email("EMAIL_INVALID")),
  locale: z.enum(routing.locales).catch(routing.defaultLocale),
});

/**
 * "Write to me when it is back." One open request per address per size — asking
 * twice is not two emails — and the row is kept after notifying, as a demand
 * signal for what the studio should cut next.
 */
export async function requestBackInStockAction(
  _prev: BackInStockState | undefined,
  formData: FormData,
): Promise<BackInStockState> {
  const rawVariant = formData.get("variantId");
  const parsed = schema.safeParse({
    productId: formData.get("productId") ?? "",
    variantId: rawVariant ? String(rawVariant) : undefined,
    email: formData.get("email") ?? "",
    locale: formData.get("locale") ?? routing.defaultLocale,
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      ok: false,
      error: flat.email ? "EMAIL_INVALID" : "NOT_FOUND",
    };
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

    // A forged variant id from another product must not attach here.
    let variantId: string | null = null;
    if (parsed.data.variantId) {
      const variant = await db.query.productVariants.findFirst({
        where: and(
          eq(productVariants.id, parsed.data.variantId),
          eq(productVariants.productId, product.id),
        ),
        columns: { id: true },
      });
      if (!variant) return { ok: false, error: "NOT_FOUND" };
      variantId = variant.id;
    }

    await db
      .insert(backInStockRequests)
      .values({
        productId: product.id,
        variantId,
        email: parsed.data.email,
        locale: parsed.data.locale,
      })
      .onConflictDoNothing();
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }

  return { ok: true };
}
