import crypto from "node:crypto";

import { afterEach, describe, it, expect } from "vitest";

import {
  buildBogOrderPayload,
  parseBogCallback,
  verifyBogCallback,
  type BogOrderInput,
} from "@/lib/payments/bog";
import { paymentProviderForRegion } from "@/lib/payments/provider";
import { buildStripeLineItems, type StripeOrderInput } from "@/lib/payments/stripe";

describe("paymentProviderForRegion", () => {
  it("routes GE to iPay and INTL to Stripe", () => {
    expect(paymentProviderForRegion("GE")).toBe("ipay");
    expect(paymentProviderForRegion("INTL")).toBe("stripe");
  });
});

const bogOrder: BogOrderInput = {
  id: "order-1",
  total: 9500,
  items: [
    {
      productId: "p1",
      id: "oi1",
      nameSnapshot: "Oak chair",
      quantity: 2,
      unitPrice: 2500,
    },
  ],
};

describe("buildBogOrderPayload", () => {
  it("converts minor units to GEL and carries the external order id", () => {
    const payload = buildBogOrderPayload({
      order: bogOrder,
      callbackUrl: "https://shop.test/api/webhooks/bog",
      successUrl: "https://shop.test/en/checkout/success",
      failUrl: "https://shop.test/en/cart",
    });

    expect(payload.external_order_id).toBe("order-1");
    expect(payload.purchase_units.currency).toBe("GEL");
    expect(payload.purchase_units.total_amount).toBe(95);
    expect(payload.purchase_units.basket[0]).toMatchObject({
      product_id: "p1",
      quantity: 2,
      unit_price: 25,
    });
    expect(payload.redirect_urls.success).toContain("/success");
  });

  it("falls back to the line id when a product was deleted", () => {
    const payload = buildBogOrderPayload({
      order: { ...bogOrder, items: [{ ...bogOrder.items[0], productId: null }] },
      callbackUrl: "x",
      successUrl: "x",
      failUrl: "x",
    });
    expect(payload.purchase_units.basket[0].product_id).toBe("oi1");
  });
});

describe("verifyBogCallback (fails closed)", () => {
  const original = process.env.BOG_CALLBACK_PUBLIC_KEY;
  afterEach(() => {
    if (original === undefined) delete process.env.BOG_CALLBACK_PUBLIC_KEY;
    else process.env.BOG_CALLBACK_PUBLIC_KEY = original;
  });

  it("rejects when no public key is configured", () => {
    delete process.env.BOG_CALLBACK_PUBLIC_KEY;
    expect(verifyBogCallback("{}", "c2ln")).toBe(false);
  });

  it("verifies a genuine signature and rejects a tampered body", () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
    });
    process.env.BOG_CALLBACK_PUBLIC_KEY = publicKey
      .export({ type: "spki", format: "pem" })
      .toString();

    const body = JSON.stringify({ body: { external_order_id: "order-1" } });
    const signature = crypto
      .sign("RSA-SHA256", Buffer.from(body, "utf8"), privateKey)
      .toString("base64");

    expect(verifyBogCallback(body, signature)).toBe(true);
    expect(verifyBogCallback(body + " ", signature)).toBe(false);
    expect(verifyBogCallback(body, null)).toBe(false);
  });
});

describe("parseBogCallback", () => {
  it("reads a completed order as paid", () => {
    expect(
      parseBogCallback({
        body: { external_order_id: "order-1", order_status: { key: "completed" } },
      }),
    ).toEqual({ externalOrderId: "order-1", paid: true });
  });

  it("treats any other status as not paid (fail closed)", () => {
    expect(
      parseBogCallback({
        body: { external_order_id: "order-1", order_status: { key: "rejected" } },
      }),
    ).toEqual({ externalOrderId: "order-1", paid: false });
    expect(parseBogCallback(null)).toEqual({ externalOrderId: "", paid: false });
  });
});

const stripeOrder: StripeOrderInput = {
  id: "order-2",
  email: "a@b.com",
  shippingCost: 1500,
  items: [
    { nameSnapshot: "Brass lamp", quantity: 1, unitPrice: 4000 },
  ],
};

describe("buildStripeLineItems", () => {
  it("uses cents directly and adds a shipping line", () => {
    const lines = buildStripeLineItems(stripeOrder);
    expect(lines).toHaveLength(2);
    expect(lines[0].price_data?.unit_amount).toBe(4000);
    expect(lines[0].price_data?.currency).toBe("usd");
    expect(lines[1].price_data?.product_data?.name).toBe("Shipping");
    expect(lines[1].price_data?.unit_amount).toBe(1500);
  });

  it("omits the shipping line when shipping is free", () => {
    const lines = buildStripeLineItems({ ...stripeOrder, shippingCost: 0 });
    expect(lines).toHaveLength(1);
  });
});
