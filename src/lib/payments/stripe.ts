import Stripe from "stripe";

/**
 * Stripe — the international/USD rail. Hosted Checkout: create a session, send
 * the shopper to it, and confirm via a signed webhook. Amounts are minor units
 * (cents), which is exactly what Stripe wants, so no conversion.
 *
 * The client is env-gated: without STRIPE_SECRET_KEY it throws rather than
 * making a call, so the app builds before Stripe is provisioned. The line-item
 * builder is pure and unit-tested.
 */
export type StripeOrderInput = {
  id: string;
  email: string;
  shippingCost: number;
  items: { nameSnapshot: string; quantity: number; unitPrice: number }[];
};

let cached: Stripe | null = null;

function client(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  cached ??= new Stripe(key);
  return cached;
}

export function buildStripeLineItems(
  order: StripeOrderInput,
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const lines: Stripe.Checkout.SessionCreateParams.LineItem[] = order.items.map(
    (item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        unit_amount: item.unitPrice,
        product_data: { name: item.nameSnapshot },
      },
    }),
  );

  if (order.shippingCost > 0) {
    lines.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: order.shippingCost,
        product_data: { name: "Shipping" },
      },
    });
  }

  return lines;
}

/** Create a Checkout session; returns the hosted-payment URL. */
export async function createStripeCheckout({
  order,
  successUrl,
  cancelUrl,
}: {
  order: StripeOrderInput;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string }> {
  const session = await client().checkout.sessions.create({
    mode: "payment",
    line_items: buildStripeLineItems(order),
    customer_email: order.email,
    client_reference_id: order.id,
    metadata: { orderId: order.id },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  if (!session.url) throw new Error("Stripe session returned no URL");
  return { url: session.url };
}

/** Verify + parse a Stripe webhook payload against the signing secret. */
export function constructStripeEvent(
  payload: string,
  signature: string,
): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  return client().webhooks.constructEvent(payload, signature, secret);
}
