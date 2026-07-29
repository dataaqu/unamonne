"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { makeOfferCode } from "@/lib/abandoned-cart";
import { db } from "@/lib/db";
import { abandonedCartEmails, carts } from "@/lib/db/schema";
import { resendRecoveryMailer } from "@/lib/email/abandoned-cart";

import { requireAdmin } from "./form";

/**
 * Manually send (or re-send) a recovery offer for one cart from the admin
 * screen. Marks a still-active cart abandoned, logs the send with a fresh offer
 * code, and dispatches through the same mailer the cron uses — so when Resend
 * lands in T4.4 both paths upgrade together. Converted carts are ignored: an
 * order already happened.
 */
export async function sendOfferEmail(formData: FormData): Promise<void> {
  await requireAdmin();

  const cartId = String(formData.get("cartId") ?? "");
  const locale = String(formData.get("locale") ?? "ka");
  if (!cartId) return;

  const cart = await db.query.carts.findFirst({ where: eq(carts.id, cartId) });
  if (!cart || cart.status === "converted") return;

  const offerCode = makeOfferCode();
  await db.transaction(async (tx) => {
    if (cart.status === "active") {
      await tx
        .update(carts)
        .set({ status: "abandoned", updatedAt: new Date() })
        .where(eq(carts.id, cartId));
    }
    await tx.insert(abandonedCartEmails).values({ cartId, offerCode });
  });

  await resendRecoveryMailer({ cartId, email: cart.email, offerCode });

  revalidatePath(`/${locale}/admin/abandoned-carts`);
}
