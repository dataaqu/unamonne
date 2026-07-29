import { getLocale, getTranslations } from "next-intl/server";

import { auth } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { findOrdersByUser } from "@/lib/orders";

export default async function AccountOrdersPage() {
  const [session, locale, t] = await Promise.all([
    auth(),
    getLocale(),
    getTranslations("Account"),
  ]);

  const orders = await findOrdersByUser(session!.user.id);
  const dateFmt = new Intl.DateTimeFormat(locale === "ka" ? "ka-GE" : "en-US", {
    dateStyle: "medium",
  });

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">{t("ordersTitle")}</h1>

      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noOrders")}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-lg border p-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium">
                  {t("orderNumber", { id: order.id.slice(0, 8).toUpperCase() })}
                </span>
                <span className="text-muted-foreground">
                  {dateFmt.format(order.createdAt)}
                </span>
              </div>

              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-muted-foreground">
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  {t(`paymentStatus.${order.paymentStatus}`)}
                </span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  {t(`fulfillmentStatus.${order.fulfillmentStatus}`)}
                </span>
              </div>

              <ul className="mt-3 space-y-0.5">
                {order.items.map((item) => (
                  <li key={item.id} className="text-muted-foreground">
                    {item.quantity}× {item.nameSnapshot}
                  </li>
                ))}
              </ul>

              <p className="mt-3 font-medium tabular-nums">
                {formatMoney(order.total, order.region, locale)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
