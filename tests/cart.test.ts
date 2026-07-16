import { describe, it, expect } from "vitest";

import { cartTotals, lineUnitPrice, type CartLine } from "@/lib/cart";

/** Minimal shape of the fields the totals helpers actually read. */
function line(quantity: number, gel: number, usd: number) {
  return { quantity, unitPriceGel: gel, unitPriceUsd: usd } as CartLine;
}

describe("lineUnitPrice", () => {
  it("picks the snapshot matching the active region", () => {
    const l = line(1, 5000, 1800);
    expect(lineUnitPrice(l, "GE")).toBe(5000);
    expect(lineUnitPrice(l, "INTL")).toBe(1800);
  });
});

describe("cartTotals", () => {
  it("treats a missing cart as empty rather than throwing", () => {
    expect(cartTotals(null, "GE")).toEqual({ count: 0, subtotal: 0 });
  });

  it("sums quantities and multiplies price by quantity", () => {
    const cart = { items: [line(2, 5000, 1800), line(1, 2500, 900)] };
    expect(cartTotals(cart, "GE")).toEqual({ count: 3, subtotal: 12500 });
  });

  it("re-totals in the other currency from the same lines", () => {
    const cart = { items: [line(2, 5000, 1800), line(1, 2500, 900)] };
    expect(cartTotals(cart, "INTL")).toEqual({ count: 3, subtotal: 4500 });
  });

  it("stays in integer minor units, never floats", () => {
    const cart = { items: [line(3, 3333, 1111)] };
    const { subtotal } = cartTotals(cart, "GE");
    expect(subtotal).toBe(9999);
    expect(Number.isInteger(subtotal)).toBe(true);
  });
});
