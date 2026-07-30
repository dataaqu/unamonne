"use server";

import { redirect } from "next/navigation";

import { cartTotals } from "@/lib/cart";
import { getCart } from "@/lib/cart-session";
import { quoteDiscount, recordRedemption } from "@/lib/discounts";
import { appUrl } from "@/lib/email/client";
import { createOrderFromCart, findOrderById } from "@/lib/orders";
import { buildBogOrderPayload, createBogPayment } from "@/lib/payments/bog";
import { paymentProviderForRegion } from "@/lib/payments/provider";
import { createStripeCheckout } from "@/lib/payments/stripe";
import { getRegion } from "@/lib/region";
import { getShippingZones, quoteShipping } from "@/lib/shipping";
import { localePath } from "@/i18n/navigation";

import { checkoutSchema, extractCheckout } from "./schema";

export type CheckoutState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Place the order and hand off to the payment provider. Region routes the rail
 * (GE → iPay, INTL → Stripe); createOrderFromCart snapshots the order and flips
 * the cart to converted, then we redirect the shopper to the hosted payment
 * page. The webhook (below) marks the order paid. Payment-start failures are
 * caught and surfaced; the redirect itself must escape the try (it throws).
 */
export async function startCheckout(
  _prev: CheckoutState | undefined,
  formData: FormData,
): Promise<CheckoutState> {
  const locale = String(formData.get("locale") ?? "en");

  const parsed = checkoutSchema.safeParse(extractCheckout(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  const cart = await getCart();
  if (!cart || cart.items.length === 0) return { ok: false, error: "EMPTY" };

  const region = await getRegion();
  const { subtotal } = cartTotals(cart, region);

  // Re-price the offer code here rather than trusting what the cart displayed:
  // a code can expire, run out, or stop clearing its minimum between the cart
  // page and this submit.
  const discount = await quoteDiscount(cart.discountCode, subtotal, region);

  const quote = quoteShipping(await getShippingZones(), {
    country: data.country,
    region,
    // Free-shipping thresholds are judged on what is actually being paid.
    subtotal: subtotal - (discount?.amount ?? 0),
  });
  if (!quote) return { ok: false, error: "NO_SHIPPING" };

  const provider = paymentProviderForRegion(region);

  const orderId = await createOrderFromCart({
    cart,
    region,
    locale,
    email: data.email,
    provider,
    shippingCost: quote.cost,
    discount,
    isGift: cart.isGift,
    address: {
      name: data.fullName,
      phone: data.phone,
      country: data.country,
      city: data.city,
      line1: data.line1,
      line2: data.line2,
      postalCode: data.postalCode,
    },
  });

  const order = await findOrderById(orderId);
  if (!order) return { ok: false, error: "UNKNOWN" };

  // Count the redemption once the order exists. Deliberately not waiting for
  // payment: a capped code that is held by an abandoned payment is a smaller
  // problem than the same code being spent twice in parallel checkouts.
  if (discount) await recordRedemption(discount.code);

  const base = appUrl();
  const successUrl = `${base}${localePath(locale, "/checkout/success")}?order=${orderId}`;
  const cancelUrl = `${base}${localePath(locale, "/cart")}`;

  let url: string;
  try {
    if (provider === "ipay") {
      const result = await createBogPayment(
        buildBogOrderPayload({
          order,
          callbackUrl: `${base}/api/webhooks/bog`,
          successUrl,
          failUrl: cancelUrl,
        }),
      );
      url = result.redirectUrl;
    } else {
      const result = await createStripeCheckout({ order, successUrl, cancelUrl });
      url = result.url;
    }
  } catch (error) {
    console.error("[checkout] failed to start payment", error);
    return { ok: false, error: "PAYMENT_FAILED" };
  }

  redirect(url);
}
