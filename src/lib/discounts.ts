import { asc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { discountCodes, type DiscountCode } from "@/lib/db/schema";
import type { Region } from "@/lib/region";

export type DiscountResult =
  | { ok: true; code: string; amount: number }
  | { ok: false; reason: "NOT_FOUND" | "EXPIRED" | "USED_UP" | "MIN_SUBTOTAL" };

/** Codes are stored and compared uppercase, so `welcome10` finds `WELCOME10`. */
export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * What a code takes off a subtotal, in the region's currency and minor units.
 *
 * Pure, so the arithmetic is testable without a database, and used in three
 * places that must agree: the cart summary, the checkout summary, and the order
 * total that is actually charged.
 *
 * A percentage applies to any currency; a fixed amount is stored per currency
 * (a live FX conversion would make the same code worth different amounts
 * depending on when the shopper looked). The discount never exceeds the
 * subtotal — shipping is charged on its own and is never paid for by a code.
 */
export function applyDiscount(
  discount: DiscountCode,
  subtotal: number,
  region: Region,
  now: Date = new Date(),
): DiscountResult {
  if (!discount.isActive) return { ok: false, reason: "EXPIRED" };
  if (discount.startsAt && discount.startsAt > now) {
    return { ok: false, reason: "EXPIRED" };
  }
  if (discount.expiresAt && discount.expiresAt <= now) {
    return { ok: false, reason: "EXPIRED" };
  }
  if (
    discount.maxRedemptions !== null &&
    discount.redemptions >= discount.maxRedemptions
  ) {
    return { ok: false, reason: "USED_UP" };
  }

  const minimum =
    region === "GE" ? discount.minSubtotalGel : discount.minSubtotalUsd;
  if (minimum !== null && subtotal < minimum) {
    return { ok: false, reason: "MIN_SUBTOTAL" };
  }

  let amount = 0;
  if (discount.percentOff !== null) {
    amount = Math.round((subtotal * discount.percentOff) / 100);
  } else {
    amount =
      (region === "GE" ? discount.amountOffGel : discount.amountOffUsd) ?? 0;
  }

  amount = Math.max(0, Math.min(amount, subtotal));
  if (amount === 0) return { ok: false, reason: "NOT_FOUND" };

  return { ok: true, code: discount.code, amount };
}

/** Every code, for the admin list. */
export function listDiscountCodes() {
  return db.query.discountCodes.findMany({ orderBy: [asc(discountCodes.code)] });
}

export function findDiscountByCode(code: string) {
  return db.query.discountCodes.findFirst({
    where: eq(discountCodes.code, normalizeCode(code)),
  });
}

/**
 * Resolve a code applied to a cart. Returns null (rather than throwing) when
 * the code no longer holds — a code that expires mid-session simply stops
 * discounting instead of blocking checkout.
 */
export async function quoteDiscount(
  code: string | null | undefined,
  subtotal: number,
  region: Region,
  now: Date = new Date(),
): Promise<{ code: string; amount: number } | null> {
  if (!code) return null;
  const discount = await findDiscountByCode(code);
  if (!discount) return null;

  const result = applyDiscount(discount, subtotal, region, now);
  return result.ok ? { code: result.code, amount: result.amount } : null;
}

/**
 * Count a redemption once an order is placed against the code. Incremented in
 * SQL rather than read-modify-write, so two shoppers checking out at the same
 * moment cannot both claim the last use of a capped code.
 */
export async function recordRedemption(code: string): Promise<void> {
  await db
    .update(discountCodes)
    .set({
      redemptions: sql`${discountCodes.redemptions} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(discountCodes.code, normalizeCode(code)));
}
