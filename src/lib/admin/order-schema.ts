import { z } from "zod";

import { fulfillmentStatus, paymentStatus } from "@/lib/db/schema";

/**
 * Status vocabularies are derived from the DB enums (single source of truth):
 * adding a status in the schema surfaces it here without a second edit.
 */
export const FULFILLMENT_STATUSES = fulfillmentStatus.enumValues;
export const PAYMENT_STATUSES = paymentStatus.enumValues;

export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

function isFulfillment(v: string): v is FulfillmentStatus {
  return (FULFILLMENT_STATUSES as readonly string[]).includes(v);
}

function isPayment(v: string): v is PaymentStatus {
  return (PAYMENT_STATUSES as readonly string[]).includes(v);
}

/**
 * Admin fulfillment update. Payment status is driven by the payment webhook,
 * not the admin, so only fulfillment + tracking are editable here. A blank
 * tracking field clears the number rather than storing an empty string.
 */
export const orderUpdateSchema = z.object({
  fulfillmentStatus: z
    .string()
    .refine(isFulfillment, { message: "INVALID_STATUS" }),
  trackingNumber: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .default(null),
});

export type OrderUpdateValues = z.infer<typeof orderUpdateSchema>;

export function extractOrderUpdate(formData: FormData) {
  return {
    fulfillmentStatus: formData.get("fulfillmentStatus") ?? "",
    trackingNumber: formData.get("trackingNumber") ?? "",
  };
}

export type OrderFilters = {
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
};

/**
 * Normalize the list's query-string filters. Unknown or blank values are
 * dropped (treated as "no filter") rather than rejected, so a stale or
 * hand-edited URL degrades to the full list instead of an error.
 */
export function parseOrderFilters(input: {
  payment?: string | null;
  fulfillment?: string | null;
}): OrderFilters {
  const filters: OrderFilters = {};
  if (input.payment && isPayment(input.payment)) {
    filters.paymentStatus = input.payment;
  }
  if (input.fulfillment && isFulfillment(input.fulfillment)) {
    filters.fulfillmentStatus = input.fulfillment;
  }
  return filters;
}
