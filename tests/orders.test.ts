import { describe, it, expect } from "vitest";

import {
  buildOrderDraft,
  ownsOrder,
  type OrderDraftLine,
} from "@/lib/orders";

const lines: OrderDraftLine[] = [
  {
    productId: "p1",
    nameSnapshot: "Selene signet",
    variantLabel: "16",
    engraving: "ნინო",
    quantity: 2,
    unitPriceGel: 2500,
    unitPriceUsd: 1000,
  },
  {
    productId: "p2",
    nameSnapshot: "Crescent drops",
    variantLabel: null,
    engraving: null,
    quantity: 1,
    unitPriceGel: 4000,
    unitPriceUsd: 1500,
  },
];

describe("buildOrderDraft", () => {
  it("prices a Georgian order in GEL from the GEL snapshots", () => {
    const draft = buildOrderDraft({ lines, region: "GE", shippingCost: 500 });

    expect(draft.currency).toBe("GEL");
    expect(draft.subtotal).toBe(2 * 2500 + 4000); // 9000
    expect(draft.shippingCost).toBe(500);
    expect(draft.total).toBe(9500);
    expect(draft.items[0]).toMatchObject({
      nameSnapshot: "Selene signet",
      unitPrice: 2500,
      lineTotal: 5000,
    });
  });

  it("prices an international order in USD from the USD snapshots", () => {
    const draft = buildOrderDraft({ lines, region: "INTL", shippingCost: 1500 });

    expect(draft.currency).toBe("USD");
    expect(draft.subtotal).toBe(2 * 1000 + 1500); // 3500
    expect(draft.total).toBe(5000);
    expect(draft.items[0].unitPrice).toBe(1000);
  });

  it("folds tax into the total", () => {
    const draft = buildOrderDraft({
      lines,
      region: "GE",
      shippingCost: 0,
      tax: 900,
    });

    expect(draft.tax).toBe(900);
    expect(draft.total).toBe(9900);
  });

  it("defaults tax to zero", () => {
    const draft = buildOrderDraft({ lines, region: "GE", shippingCost: 0 });

    expect(draft.tax).toBe(0);
    expect(draft.total).toBe(9000);
  });

  it("takes a discount off the goods before shipping is added", () => {
    const draft = buildOrderDraft({
      lines,
      region: "GE",
      shippingCost: 500,
      discountAmount: 1000,
    });

    expect(draft.subtotal).toBe(9000);
    expect(draft.discountAmount).toBe(1000);
    expect(draft.total).toBe(9000 - 1000 + 500);
  });

  it("clamps an over-generous discount to the subtotal", () => {
    // Shipping still has to be paid: a code discounts goods, never postage.
    const draft = buildOrderDraft({
      lines,
      region: "GE",
      shippingCost: 500,
      discountAmount: 99_999,
    });

    expect(draft.discountAmount).toBe(9000);
    expect(draft.total).toBe(500);
  });

  it("carries the chosen size and engraving onto the frozen line", () => {
    const draft = buildOrderDraft({ lines, region: "GE", shippingCost: 0 });

    expect(draft.items[0]).toMatchObject({
      variantLabel: "16",
      engraving: "ნინო",
    });
    expect(draft.items[1].variantLabel).toBeNull();
  });

  it("refuses to build an order from an empty cart", () => {
    expect(() =>
      buildOrderDraft({ lines: [], region: "GE", shippingCost: 0 }),
    ).toThrow();
  });
});

describe("ownsOrder", () => {
  it("is true only for the order's own user", () => {
    expect(ownsOrder({ userId: "u1" }, "u1")).toBe(true);
    expect(ownsOrder({ userId: "u1" }, "u2")).toBe(false);
  });

  it("treats a guest order as owned by nobody", () => {
    expect(ownsOrder({ userId: null }, "u1")).toBe(false);
  });
});
