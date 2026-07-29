import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/money";
import { findOrderById } from "@/lib/orders";

import { FulfillmentForm } from "./fulfillment-form";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, locale, t] = await Promise.all([
    params,
    getLocale(),
    getTranslations("Admin.order"),
  ]);

  const order = await findOrderById(id);
  if (!order) notFound();

  const money = (amount: number) => formatMoney(amount, order.region, locale);
  const dateFmt = new Intl.DateTimeFormat(locale === "ka" ? "ka-GE" : "en-US", {
    dateStyle: "long",
  });

  return (
    <main className="flex flex-1 flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tabular-nums">
            {t("orderNumber", { id: order.id.slice(0, 8).toUpperCase() })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {dateFmt.format(order.createdAt)} · {order.email}
          </p>
        </div>
        <Link
          href="/admin/orders"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {t("back")}
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="py-2 font-medium">{t("item")}</th>
                <th className="py-2 text-right font-medium">{t("qty")}</th>
                <th className="py-2 text-right font-medium">{t("unitPrice")}</th>
                <th className="py-2 text-right font-medium">{t("lineTotal")}</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2">{item.nameSnapshot}</td>
                  <td className="py-2 text-right tabular-nums">
                    {item.quantity}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {money(item.unitPrice)}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {money(item.unitPrice * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="mt-4 ml-auto grid max-w-xs gap-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("subtotal")}</dt>
              <dd className="tabular-nums">{money(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("shipping")}</dt>
              <dd className="tabular-nums">{money(order.shippingCost)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("tax")}</dt>
              <dd className="tabular-nums">{money(order.tax)}</dd>
            </div>
            <div className="flex justify-between border-t pt-1 font-medium">
              <dt>{t("total")}</dt>
              <dd className="tabular-nums">{money(order.total)}</dd>
            </div>
          </dl>
        </section>

        <aside className="flex flex-col gap-6">
          <div className="space-y-1 text-sm">
            <h2 className="font-semibold">{t("shipTo")}</h2>
            <address className="not-italic text-muted-foreground">
              {order.shipName}
              <br />
              {order.shipLine1}
              {order.shipLine2 ? <>, {order.shipLine2}</> : null}
              <br />
              {order.shipCity}
              {order.shipPostalCode ? <> {order.shipPostalCode}</> : null},{" "}
              {order.shipCountry}
              {order.shipPhone ? (
                <>
                  <br />
                  {order.shipPhone}
                </>
              ) : null}
            </address>
          </div>

          <div className="space-y-1 text-sm">
            <h2 className="font-semibold">{t("payment")}</h2>
            <p className="text-muted-foreground">
              {t(`provider.${order.paymentProvider}`)} ·{" "}
              {t(`paymentStatus.${order.paymentStatus}`)}
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold">{t("updateFulfillment")}</h2>
            <FulfillmentForm
              id={order.id}
              current={order.fulfillmentStatus}
              tracking={order.trackingNumber ?? ""}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}
