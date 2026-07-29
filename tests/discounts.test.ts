import { describe, it, expect } from "vitest";

import { applyDiscount, normalizeCode } from "@/lib/discounts";
import type { DiscountCode } from "@/lib/db/schema";

const NOW = new Date("2026-07-29T12:00:00Z");

function code(overrides: Partial<DiscountCode> = {}): DiscountCode {
  return {
    id: "d1",
    code: "WELCOME10",
    percentOff: 10,
    amountOffGel: null,
    amountOffUsd: null,
    minSubtotalGel: null,
    minSubtotalUsd: null,
    isActive: true,
    startsAt: null,
    expiresAt: null,
    maxRedemptions: null,
    redemptions: 0,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe("normalizeCode", () => {
  it("uppercases and trims, so welcome10 finds WELCOME10", () => {
    expect(normalizeCode("  welcome10 ")).toBe("WELCOME10");
  });
});

describe("applyDiscount", () => {
  it("takes a percentage off the subtotal, rounded to minor units", () => {
    const result = applyDiscount(code(), 10_95, "GE", NOW);
    expect(result).toEqual({ ok: true, code: "WELCOME10", amount: 110 });
  });

  it("uses the fixed amount for the region's own currency", () => {
    const fixed = code({
      percentOff: null,
      amountOffGel: 2000,
      amountOffUsd: 700,
    });

    expect(applyDiscount(fixed, 100_00, "GE", NOW)).toMatchObject({
      amount: 2000,
    });
    expect(applyDiscount(fixed, 100_00, "INTL", NOW)).toMatchObject({
      amount: 700,
    });
  });

  it("never discounts more than the subtotal", () => {
    const fixed = code({ percentOff: null, amountOffGel: 50_00 });
    expect(applyDiscount(fixed, 20_00, "GE", NOW)).toMatchObject({
      amount: 20_00,
    });
  });

  it("enforces the minimum subtotal of the active region only", () => {
    const gated = code({ minSubtotalGel: 350_00, minSubtotalUsd: null });

    expect(applyDiscount(gated, 100_00, "GE", NOW)).toEqual({
      ok: false,
      reason: "MIN_SUBTOTAL",
    });
    // No USD minimum is set, so the international side is not gated.
    expect(applyDiscount(gated, 100_00, "INTL", NOW)).toMatchObject({
      ok: true,
    });
  });

  it("rejects a code that is inactive, unstarted or expired", () => {
    expect(applyDiscount(code({ isActive: false }), 100_00, "GE", NOW)).toEqual({
      ok: false,
      reason: "EXPIRED",
    });
    expect(
      applyDiscount(
        code({ startsAt: new Date("2026-08-01T00:00:00Z") }),
        100_00,
        "GE",
        NOW,
      ),
    ).toEqual({ ok: false, reason: "EXPIRED" });
    expect(
      applyDiscount(
        code({ expiresAt: new Date("2026-07-01T00:00:00Z") }),
        100_00,
        "GE",
        NOW,
      ),
    ).toEqual({ ok: false, reason: "EXPIRED" });
  });

  it("rejects a code that has been fully redeemed", () => {
    expect(
      applyDiscount(
        code({ maxRedemptions: 5, redemptions: 5 }),
        100_00,
        "GE",
        NOW,
      ),
    ).toEqual({ ok: false, reason: "USED_UP" });
  });

  it("rejects a code worth nothing in the active currency", () => {
    const usdOnly = code({
      percentOff: null,
      amountOffGel: null,
      amountOffUsd: 500,
    });
    expect(applyDiscount(usdOnly, 100_00, "GE", NOW)).toEqual({
      ok: false,
      reason: "NOT_FOUND",
    });
  });
});
