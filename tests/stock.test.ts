import { describe, it, expect } from "vitest";

import {
  MADE_TO_ORDER_CAP,
  availableStock,
  isProductAvailable,
} from "@/lib/shop";

const plain = { stock: 3, isOutOfStock: false };

describe("isProductAvailable", () => {
  it("uses the product's own stock when it has no variants", () => {
    expect(isProductAvailable(plain)).toBe(true);
    expect(isProductAvailable({ ...plain, stock: 0 })).toBe(false);
  });

  it("lets the admin's out-of-stock toggle override any count", () => {
    expect(isProductAvailable({ ...plain, isOutOfStock: true })).toBe(false);
  });

  it("delegates entirely to the variants when a product has them", () => {
    // Product-level stock is stale here — the variants are the truth.
    const withVariants = {
      stock: 99,
      isOutOfStock: false,
      variants: [
        { stock: 0, isMadeToOrder: false },
        { stock: 0, isMadeToOrder: false },
      ],
    };
    expect(isProductAvailable(withVariants)).toBe(false);
  });

  it("counts a made-to-order size as available", () => {
    expect(
      isProductAvailable({
        stock: 0,
        isOutOfStock: false,
        variants: [{ stock: 0, isMadeToOrder: true }],
      }),
    ).toBe(true);
  });
});

describe("availableStock", () => {
  it("returns the product stock when there are no variants", () => {
    expect(availableStock(plain)).toBe(3);
  });

  it("returns zero when a product with variants has none chosen", () => {
    const product = {
      stock: 0,
      isOutOfStock: false,
      variants: [{ id: "v1", stock: 4, isMadeToOrder: false }],
    };
    expect(availableStock(product)).toBe(0);
    expect(availableStock(product, "v1")).toBe(4);
  });

  it("ignores a variant id belonging to another product", () => {
    const product = {
      stock: 0,
      isOutOfStock: false,
      variants: [{ id: "v1", stock: 4, isMadeToOrder: false }],
    };
    expect(availableStock(product, "someone-elses-variant")).toBe(0);
  });

  it("caps a made-to-order size instead of reporting zero", () => {
    expect(
      availableStock(
        {
          stock: 0,
          isOutOfStock: false,
          variants: [{ id: "v1", stock: 0, isMadeToOrder: true }],
        },
        "v1",
      ),
    ).toBe(MADE_TO_ORDER_CAP);
  });

  it("is zero for anything the admin marked out of stock", () => {
    expect(availableStock({ ...plain, isOutOfStock: true })).toBe(0);
  });
});
