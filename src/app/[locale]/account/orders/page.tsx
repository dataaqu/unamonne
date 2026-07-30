import { getLocale, getTranslations } from "next-intl/server";

import { OrdersList, type OrderRow } from "@/components/account/orders-list";
import { addressLines } from "@/lib/account/address-format";
import { auth } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import {
  dominantOrderRegion,
  findOrdersByUser,
  firstOrderDate,
  orderHistoryStats,
  orderItemImage,
  orderReference,
} from "@/lib/orders";
import { getRegion } from "@/lib/region";

/**
 * Order history. The rows are built here — money formatted in the currency
 * each order was actually charged in, addresses read off the order's own frozen
 * shipping fields — so the list component only has to open and close them.
 */
export default async function AccountOrdersPage() {
  const [session, locale, t, region] = await Promise.all([
    auth(),
    getLocale(),
    getTranslations("Account"),
    getRegion(),
  ]);

  const userId = session?.user?.id;
  if (!userId) return null;

  const orders = await findOrdersByUser(userId);

  const dateFmt = new Intl.DateTimeFormat(locale === "ka" ? "ka-GE" : "en-US", {
    dateStyle: "long",
  });
  const monthYear = new Intl.DateTimeFormat(
    locale === "ka" ? "ka-GE" : "en-US",
    { month: "long", year: "numeric" },
  );

  const rows: OrderRow[] = orders.map((order) => ({
    id: order.id,
    reference: orderReference(order.id),
    date: dateFmt.format(order.createdAt),
    total: formatPrice(order.total, order.region),
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    tracking: order.trackingNumber,
    shipTo: addressLines(
      {
        fullName: order.shipName,
        line1: order.shipLine1,
        line2: order.shipLine2,
        city: order.shipCity,
        postalCode: order.shipPostalCode,
        country: order.shipCountry,
        phone: null,
      },
      locale,
    ),
    items: order.items.map((item) => {
      const image = orderItemImage(item);
      return {
        id: item.id,
        name: item.nameSnapshot,
        variant: [
          item.variantLabel,
          item.engraving ? `“${item.engraving}”` : null,
        ]
          .filter(Boolean)
          .join(" · "),
        quantity: item.quantity,
        total: formatPrice(item.unitPrice * item.quantity, order.region),
        image: image?.url ?? null,
        alt: image?.alt ?? item.nameSnapshot,
      };
    }),
  }));

  // Totalled in the currency the orders were charged in, not the one being
  // browsed in — see `dominantOrderRegion`.
  const spentRegion = dominantOrderRegion(orders) ?? region;
  const stats = orderHistoryStats(orders, spentRegion);
  const since = firstOrderDate(orders);

  return (
    <OrdersList
      orders={rows}
      title={t("ordersTitle")}
      meta={
        orders.length === 0
          ? t("ordersMetaEmpty")
          : t("ordersMeta", {
              count: stats.orders,
              spent: formatPrice(stats.spent, spentRegion),
              since: since ? monthYear.format(since) : "",
            })
      }
    />
  );
}
