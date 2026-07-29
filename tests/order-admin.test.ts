import { describe, it, expect } from "vitest";

import {
  extractOrderUpdate,
  orderUpdateSchema,
  parseOrderFilters,
} from "@/lib/admin/order-schema";

function form(values: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

describe("parseOrderFilters", () => {
  it("keeps valid payment and fulfillment values", () => {
    expect(
      parseOrderFilters({ payment: "paid", fulfillment: "shipped" }),
    ).toEqual({ paymentStatus: "paid", fulfillmentStatus: "shipped" });
  });

  it("drops unknown or blank values", () => {
    expect(parseOrderFilters({ payment: "nope", fulfillment: "" })).toEqual({});
  });

  it("accepts one filter without the other", () => {
    expect(parseOrderFilters({ fulfillment: "delivered" })).toEqual({
      fulfillmentStatus: "delivered",
    });
  });
});

describe("orderUpdateSchema", () => {
  it("accepts a known status and trims tracking to null when blank", () => {
    const parsed = orderUpdateSchema.safeParse(
      extractOrderUpdate(
        form({ fulfillmentStatus: "shipped", trackingNumber: "  " }),
      ),
    );
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.fulfillmentStatus).toBe("shipped");
      expect(parsed.data.trackingNumber).toBeNull();
    }
  });

  it("keeps a real tracking number", () => {
    const parsed = orderUpdateSchema.safeParse(
      extractOrderUpdate(
        form({ fulfillmentStatus: "delivered", trackingNumber: "GE12345" }),
      ),
    );
    expect(parsed.success && parsed.data.trackingNumber).toBe("GE12345");
  });

  it("rejects an unknown fulfillment status", () => {
    const parsed = orderUpdateSchema.safeParse(
      extractOrderUpdate(form({ fulfillmentStatus: "teleported" })),
    );
    expect(parsed.success).toBe(false);
  });
});
