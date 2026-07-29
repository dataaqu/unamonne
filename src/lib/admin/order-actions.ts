"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";

import { requireAdmin, type AdminFormState } from "./form";
import { extractOrderUpdate, orderUpdateSchema } from "./order-schema";

/**
 * Advance an order's fulfillment and set/clear its tracking number. Payment
 * status is not editable here — it belongs to the payment webhook (T3.5/T3.6),
 * so the admin can only move the physical side of the order forward.
 */
export async function updateOrderFulfillment(
  _prev: AdminFormState | undefined,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "ka");
  if (!id) return { ok: false, error: "UNKNOWN" };

  const parsed = orderUpdateSchema.safeParse(extractOrderUpdate(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db
    .update(orders)
    .set({
      fulfillmentStatus: parsed.data.fulfillmentStatus,
      trackingNumber: parsed.data.trackingNumber,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, id));

  revalidatePath(`/${locale}/admin/orders/${id}`);
  revalidatePath(`/${locale}/admin/orders`);
  return { ok: true };
}
