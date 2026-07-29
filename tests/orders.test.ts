import { describe, it, expect } from "vitest";

import { buildOrderDraft, type OrderDraftLine } from "@/lib/orders";

const lines: OrderDraftLine[] = [
  {
    productId: "p1",
    nameSnapshot: "Oak chair",
    quantity: 2,
    unitPriceGel: 2500,
    unitPriceUsd: 1000,
  },
  {
    productId: "p2",
    nameSnapshot: "Brass lamp",
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
      nameSnapshot: "Oak chair",
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

  it("refuses to build an order from an empty cart", () => {
    expect(() =>
      buildOrderDraft({ lines: [], region: "GE", shippingCost: 0 }),
    ).toThrow();
  });
});
