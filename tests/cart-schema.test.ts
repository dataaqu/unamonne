import { describe, it, expect } from "vitest";
import { getTableColumns } from "drizzle-orm";

import { carts, cartItems } from "@/lib/db/schema";
import { REGIONS } from "@/lib/region";

describe("cart schema", () => {
  it("identifies a cart by guest token or user, with the user optional", () => {
    const cols = getTableColumns(carts);
    expect(cols.token.notNull).toBe(true);
    expect(cols.token.isUnique).toBe(true);
    expect(cols.userId.notNull).toBe(false);
  });

  it("locks a currency by storing the region the cart started in", () => {
    const cols = getTableColumns(carts);
    expect(cols.region.notNull).toBe(true);
    expect(cols.region.enumValues).toEqual([...REGIONS]);
  });

  it("starts carts active and tracks the abandoned-cart lifecycle", () => {
    const cols = getTableColumns(carts);
    expect(cols.status.default).toBe("active");
    expect(cols.status.enumValues).toEqual([
      "active",
      "converted",
      "abandoned",
    ]);
  });
});

describe("cart item schema", () => {
  it("snapshots both currency prices as integer minor units", () => {
    const cols = getTableColumns(cartItems);
    expect(cols.unitPriceGel.notNull).toBe(true);
    expect(cols.unitPriceUsd.notNull).toBe(true);
    expect(cols.unitPriceGel.columnType).toBe("PgInteger");
    expect(cols.unitPriceUsd.columnType).toBe("PgInteger");
  });

  it("defaults a new line to a single unit", () => {
    const cols = getTableColumns(cartItems);
    expect(cols.quantity.default).toBe(1);
    expect(cols.cartId.notNull).toBe(true);
    expect(cols.productId.notNull).toBe(true);
  });
});
