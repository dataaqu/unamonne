import { describe, it, expect } from "vitest";

import { isRestocked } from "@/lib/back-in-stock";

const withSizes = {
  stock: 0,
  isOutOfStock: false,
  variants: [
    { id: "v16", stock: 0, isMadeToOrder: false },
    { id: "v17", stock: 2, isMadeToOrder: false },
  ],
};

describe("isRestocked", () => {
  it("waits for the exact size that was asked about", () => {
    expect(isRestocked(withSizes, "v16")).toBe(false);
    expect(isRestocked(withSizes, "v17")).toBe(true);
  });

  it("does not fire for a size that only became made-to-order", () => {
    // Made-to-order is orderable, but it is not the restock they asked for.
    const madeToOrder = {
      stock: 0,
      isOutOfStock: false,
      variants: [{ id: "v16", stock: 0, isMadeToOrder: true }],
    };
    expect(isRestocked(madeToOrder, "v16")).toBe(false);
  });

  it("falls back to the piece as a whole when no size was chosen", () => {
    expect(isRestocked(withSizes, null)).toBe(true);
    expect(
      isRestocked({ stock: 0, isOutOfStock: false, variants: [] }, null),
    ).toBe(false);
    expect(
      isRestocked({ stock: 4, isOutOfStock: false, variants: [] }, null),
    ).toBe(true);
  });

  it("never fires while the admin's out-of-stock toggle is on", () => {
    expect(
      isRestocked({ ...withSizes, isOutOfStock: true }, "v17"),
    ).toBe(false);
  });

  it("ignores a size that no longer exists", () => {
    expect(isRestocked(withSizes, "deleted-variant")).toBe(false);
  });
});
