import type { Order, OrderItem } from "@/lib/db/schema";
import { formatMoney } from "@/lib/money";

import { sendEmail } from "./client";
import { OrderConfirmationEmail } from "./templates/order-confirmation";

const SUBJECT = {
  en: (n: string) => `Order ${n} confirmed`,
  ka: (n: string) => `შეკვეთა ${n} დადასტურდა`,
} as const;

/**
 * Send the order-confirmation email for a paid order. Called from the payment
 * webhooks (T3.5/T3.6) once an order is marked paid. Money is formatted in the
 * order's own currency; the locale defaults to English because the order
 * itself does not carry one (the checkout passes the shopper's locale).
 */
export async function sendOrderConfirmation(
  order: Order & { items: OrderItem[] },
  locale: "ka" | "en" = "en",
): Promise<{ sent: boolean }> {
  const orderNumber = order.id.slice(0, 8).toUpperCase();
  const money = (amount: number) => formatMoney(amount, order.region, locale);

  const items = order.items.map((item) => ({
    name: item.nameSnapshot,
    quantity: item.quantity,
    price: money(item.unitPrice * item.quantity),
  }));

  const cityLine = [
    [order.shipCity, order.shipPostalCode].filter(Boolean).join(" "),
    order.shipCountry,
  ]
    .filter(Boolean)
    .join(", ");

  const shipTo = [
    order.shipName,
    order.shipLine1,
    order.shipLine2,
    cityLine,
    order.shipPhone,
  ].filter((line): line is string => Boolean(line));

  return sendEmail({
    to: order.email,
    subject: SUBJECT[locale](orderNumber),
    react: (
      <OrderConfirmationEmail
        locale={locale}
        orderNumber={orderNumber}
        items={items}
        subtotal={money(order.subtotal)}
        shipping={money(order.shippingCost)}
        tax={money(order.tax)}
        total={money(order.total)}
        shipTo={shipTo}
      />
    ),
  });
}
