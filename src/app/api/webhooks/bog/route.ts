import { NextResponse } from "next/server";

import { sendOrderConfirmation } from "@/lib/email/order-confirmation";
import { findOrderById, markOrderFailed, markOrderPaid } from "@/lib/orders";
import { parseBogCallback, verifyBogCallback } from "@/lib/payments/bog";

/**
 * Bank of Georgia payment callback. BoG POSTs the settled order here; we map it
 * back to our order via `external_order_id` and move payment_status. A paid
 * order also triggers the confirmation email.
 *
 * The body is verified against BoG's signature BEFORE any state change — this
 * endpoint moves money, so it fails closed: an unsigned/unverifiable request
 * (including before BOG_CALLBACK_PUBLIC_KEY is provisioned) is rejected and
 * mutates nothing. The exact raw bytes are used for verification, then parsed.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const raw = await request.text();
  const signature = request.headers.get("callback-signature");

  if (!verifyBogCallback(raw, signature)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new NextResponse("Bad Request", { status: 400 });
  }

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
