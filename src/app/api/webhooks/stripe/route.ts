import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { sendOrderConfirmation } from "@/lib/email/order-confirmation";
import { findOrderById, markOrderPaid } from "@/lib/orders";
import { constructStripeEvent } from "@/lib/payments/stripe";

/**
 * Stripe webhook. The raw body is verified against STRIPE_WEBHOOK_SECRET before
 * we trust it; on `checkout.session.completed` the referenced order is marked
 * paid and the confirmation email is sent. Uses the raw request text (not
 * request.json) because signature verification is over the exact bytes.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new NextResponse("Missing signature", { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = constructStripeEvent(payload, signature);
  } catch (error) {
    console.error("[stripe] invalid webhook signature", error);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId ?? session.client_reference_id;
    if (orderId) {
      await markOrderPaid(orderId);
      const order = await findOrderById(orderId);
      if (order) await sendOrderConfirmation(order);
    }
  }

  return NextResponse.json({ received: true });
}
