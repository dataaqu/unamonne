import type { Order } from "@/lib/db/schema";

/**
 * Status is carried by a dot, never by colouring the text — the same rule the
 * admin panel follows, so "shipped" looks like "shipped" everywhere.
 */
export const PAYMENT_DOT: Record<Order["paymentStatus"], string> = {
  pending: "bg-warning-500",
  paid: "bg-success-500",
  failed: "bg-danger-500",
  refunded: "bg-ink-400",
};

export const FULFILLMENT_DOT: Record<Order["fulfillmentStatus"], string> = {
  pending: "bg-warning-500",
  processing: "bg-warning-500",
  shipped: "bg-info-500",
  delivered: "bg-success-500",
  cancelled: "bg-ink-400",
};

/**
 * An order is "open" until it has landed or been called off. Used by the
 * All / Open / Completed filter on the order history.
 */
export function isOpenOrder(status: Order["fulfillmentStatus"]): boolean {
  return status !== "delivered" && status !== "cancelled";
}
