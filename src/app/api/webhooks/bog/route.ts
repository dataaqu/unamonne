import { NextResponse } from "next/server";

import { sendOrderConfirmation } from "@/lib/email/order-confirmation";
import { findOrderById, markOrderFailed, markOrderPaid } from "@/lib/orders";
import { parseBogCallback } from "@/lib/payments/bog";

/**
 * Bank of Georgia payment callback. BoG POSTs the settled order here; we map it
 * back to our order via `external_order_id` and move payment_status. A paid
 * order also triggers the confirmation email.
 *
 * NOTE: production should also verify BoG's `Callback-Signature` header against
 * their public key before trusting the body; wired once the key is provisioned.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const payload = await request.json().catch(() => null);
  const { externalOrderId, paid } = parseBogCallback(payload);

  if (!externalOrderId) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  if (paid) {
    await markOrderPaid(externalOrderId);
    const order = await findOrderById(externalOrderId);
    if (order) await sendOrderConfirmation(order);
  } else {
    await markOrderFailed(externalOrderId);
  }

  return NextResponse.json({ received: true });
}
