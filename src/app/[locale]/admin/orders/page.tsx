import { getLocale, getTranslations } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  FULFILLMENT_STATUSES,
  PAYMENT_STATUSES,
  parseOrderFilters,
} from "@/lib/admin/order-schema";
import { formatMoney } from "@/lib/money";
import { findOrdersForAdmin } from "@/lib/orders";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string; fulfillment?: string }>;
}) {
  const [sp, locale, t] = await Promise.all([
    searchParams,
    getLocale(),
    getTranslations("Admin.order"),
  ]);

  const filters = parseOrderFilters({
    payment: sp.payment,
    fulfillment: sp.fulfillment,
  });
  const rows = await findOrdersForAdmin(filters);
  const dateFmt = new Intl.DateTimeFormat(locale === "ka" ? "ka-GE" : "en-US", {
    dateStyle: "medium",
  });

  const selectClass =
    "rounded-md border bg-background px-2 py-1.5 text-sm";

  return (
    <main className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <form className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">{t("filterPayment")}</span>
          <select
            name="payment"
            defaultValue={sp.payment ?? ""}
            className={selectClass}
          >
            <option value="">{t("all")}</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`paymentStatus.${s}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">{t("filterFulfillment")}</span>
          <select
            name="fulfillment"
            defaultValue={sp.fulfillment ?? ""}
            className={selectClass}
          >
            <option value="">{t("all")}</option>
            {FULFILLMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`fulfillmentStatus.${s}`)}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" className={buttonVariants({ size: "sm" })}>
          {t("apply")}
        </button>
      </form>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noOrders")}</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th className="py-2 font-medium">{t("number")}</th>
              <th className="py-2 font-medium">{t("date")}</th>
              <th className="py-2 font-medium">{t("customer")}</th>
              <th className="py-2 font-medium">{t("payment")}</th>
              <th className="py-2 font-medium">{t("fulfillment")}</th>
              <th className="py-2 text-right font-medium">{t("total")}</th>
              <th className="py-2 text-right font-medium">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((order) => (
              <tr key={order.id} className="border-b">
                <td className="py-2 font-medium tabular-nums">
                  {order.id.slice(0, 8).toUpperCase()}
                </td>
                <td className="py-2 text-muted-foreground">
                  {dateFmt.format(order.createdAt)}
                </td>
                <td className="py-2 text-muted-foreground">{order.email}</td>
                <td className="py-2">{t(`paymentStatus.${order.paymentStatus}`)}</td>
                <td className="py-2">
                  {t(`fulfillmentStatus.${order.fulfillmentStatus}`)}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {formatMoney(order.total, order.region, locale)}
                </td>
                <td className="py-2 text-right">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    {t("view")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
