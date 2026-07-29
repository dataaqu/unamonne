import { and, eq, isNull } from "drizzle-orm";

import { routing } from "@/i18n/routing";
import { pickTranslation } from "@/lib/catalog";
import { db } from "@/lib/db";
import { backInStockRequests } from "@/lib/db/schema";
import { appUrl } from "@/lib/email/client";
import { isProductAvailable } from "@/lib/shop";

/**
 * One outstanding "write to me when it is back" request, resolved to everything
 * the mail needs. Pure data — the mailer is injected, so the sweep is testable
 * without Resend.
 */
export type RestockNotice = {
  requestId: string;
  email: string;
  locale: "ka" | "en";
  productName: string;
  variantLabel: string | null;
  productUrl: string;
};

export type RestockMailer = (notice: RestockNotice) => Promise<void>;

/**
 * Whether a request is now satisfiable.
 *
 * A request for a specific size waits for that size; one for a piece with no
 * sizes waits for the piece. Pure, so the rule is testable without a clock or a
 * database.
 */
export function isRestocked(
  product: {
    stock: number;
    isOutOfStock: boolean;
    variants: { id: string; stock: number; isMadeToOrder: boolean }[];
  },
  variantId: string | null,
): boolean {
  if (product.isOutOfStock) return false;

  if (variantId) {
    const variant = product.variants.find((v) => v.id === variantId);
    return variant ? variant.stock > 0 : false;
  }

  return isProductAvailable(product);
}

/**
 * Notify everyone waiting on a piece that has come back, then stamp the request
 * so nobody is mailed twice.
 *
 * `notifiedAt` is written even when the mailer is a no-op (no Resend key in
 * development): the alternative is a queue that re-sends every run the moment a
 * key is added, which would mail months of backlog at once.
 */
export async function notifyRestocked(
  send: RestockMailer,
  now: Date = new Date(),
): Promise<{ notified: number }> {
  const pending = await db.query.backInStockRequests.findMany({
    where: isNull(backInStockRequests.notifiedAt),
    with: {
      product: { with: { translations: true, variants: true } },
      variant: true,
    },
  });

  let notified = 0;

  for (const request of pending) {
    if (!request.product || request.product.isHidden) continue;
    if (!isRestocked(request.product, request.variantId)) continue;

    const tr = pickTranslation(request.product.translations, request.locale);
    if (!tr) continue;

    try {
      await send({
        requestId: request.id,
        email: request.email,
        locale: request.locale,
        productName: tr.name,
        variantLabel: request.variant?.label ?? null,
        productUrl: `${appUrl()}/${request.locale}/product/${tr.slug}`,
      });
    } catch (error) {
      // One bad address must not stop the rest of the sweep.
      console.error("[back-in-stock] failed to notify", request.id, error);
      continue;
    }

    await db
      .update(backInStockRequests)
      .set({ notifiedAt: now })
      .where(eq(backInStockRequests.id, request.id));
    notified += 1;
  }

  return { notified };
}

/** Requests still waiting on one product, for the admin product view. */
export function findPendingRequests(productId: string) {
  return db.query.backInStockRequests.findMany({
    where: and(
      eq(backInStockRequests.productId, productId),
      isNull(backInStockRequests.notifiedAt),
    ),
    with: { variant: true },
  });
}

export function isKnownLocale(value: string): value is "ka" | "en" {
  return (routing.locales as readonly string[]).includes(value);
}
