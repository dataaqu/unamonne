import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { PrintButton } from "@/components/account/print-button";
import { MicroLabel } from "@/components/ui/field";
import { BackIcon } from "@/components/ui/icons";
import { Link } from "@/i18n/navigation";
import { addressLines } from "@/lib/account/address-format";
import { auth } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { formatPrice } from "@/lib/money";
import { findOrderById, orderReference, ownsOrder } from "@/lib/orders";

/**
 * The invoice behind "Download invoice" — a document, not a page: printed (or
 * saved to PDF) straight from the browser, so the shop owes no PDF pipeline and
 * the numbers can never drift from the order they were read off.
 */
export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, session, locale, t, tCheckout] = await Promise.all([
    params,
    auth(),
    getLocale(),
    getTranslations("Account"),
    getTranslations("Checkout"),
  ]);

  const userId = session?.user?.id;
  if (!userId) return null;

  const order = await findOrderById(id);
  // A customer may only ever read their own invoice; anything else is a 404,
  // which also keeps order ids from being probed.
  if (!order || !ownsOrder(order, userId)) notFound();

  const dateFmt = new Intl.DateTimeFormat(locale === "ka" ? "ka-GE" : "en-US", {
    dateStyle: "long",
  });

  const totals = [
    [tCheckout("subtotal"), formatPrice(order.subtotal, order.region)],
    order.discountAmount > 0
      ? [
          tCheckout("discount", { code: order.discountCode ?? "" }),
          `−${formatPrice(order.discountAmount, order.region)}`,
        ]
      : null,
    [tCheckout("shipping"), formatPrice(order.shippingCost, order.region)],
    order.tax > 0 ? [tCheckout("tax"), formatPrice(order.tax, order.region)] : null,
  ].filter((row): row is [string, string] => row !== null);

  return (
    <div>
      <div
        data-print-hide
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-ink-600 transition-colors hover:text-ink-900"
        >
          <BackIcon className="h-4 w-4" />
          {t("ordersTitle")}
        </Link>
        <PrintButton label={t("printInvoice")} />
      </div>

      <article
        data-print-root
        className="mt-6 max-w-3xl border border-ink-200 bg-white p-8 lg:p-12"
      >
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-ink-900 pb-6">
          <div>
            <div className="text-sm uppercase tracking-[0.3em]">
              {BRAND.name}
            </div>
            <p className="mt-2 text-xs text-ink-500">
              {BRAND.legalName} · {BRAND.city}
            </p>
          </div>
          <div className="text-right">
            <MicroLabel>{t("invoice")}</MicroLabel>
            <div className="mt-1.5 font-mono text-sm">
              {orderReference(order.id)}
            </div>
            <div className="mt-1 text-xs tabular-nums text-ink-500">
              {dateFmt.format(order.createdAt)}
            </div>
          </div>
        </header>

        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <div>
            <MicroLabel>{t("billedTo")}</MicroLabel>
            <address className="mt-2 text-[13px] not-italic leading-relaxed text-ink-700">
              {addressLines(
                {
                  fullName: order.shipName,
                  line1: order.shipLine1,
                  line2: order.shipLine2,
                  city: order.shipCity,
                  postalCode: order.shipPostalCode,
                  country: order.shipCountry,
                  phone: order.shipPhone,
                },
                locale,
              ).map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
              <span className="block">{order.email}</span>
            </address>
          </div>
          <div className="sm:text-right">
            <MicroLabel>{t("paymentStatusLabel")}</MicroLabel>
            <div className="mt-2 text-[13px]">
              {t(`paymentStatus.${order.paymentStatus}`)}
            </div>
            {order.trackingNumber ? (
              <>
                <MicroLabel className="mt-5">{t("tracking")}</MicroLabel>
                <div className="mt-2 font-mono text-xs">
                  {order.trackingNumber}
                </div>
              </>
            ) : null}
          </div>
        </div>

        <table className="mt-10 w-full text-[13px]">
          <thead>
            <tr className="border-b border-ink-900 text-[10px] uppercase tracking-[0.18em] text-ink-500">
              <th className="pb-2 text-left font-normal">{t("piece")}</th>
              <th className="pb-2 text-right font-normal">{t("qtyShort")}</th>
              <th className="pb-2 text-right font-normal">{tCheckout("total")}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-ink-200">
                <td className="py-3">
                  <span className="text-[11px] uppercase tracking-[0.16em]">
                    {item.nameSnapshot}
                  </span>
                  {item.variantLabel || item.engraving ? (
                    <span className="mt-1 block text-xs text-ink-500">
                      {[
                        item.variantLabel,
                        item.engraving ? `“${item.engraving}”` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  ) : null}
                </td>
                <td className="py-3 text-right tabular-nums">{item.quantity}</td>
                <td className="py-3 text-right tabular-nums">
                  {formatPrice(item.unitPrice * item.quantity, order.region)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 ml-auto max-w-xs">
          {totals.map(([label, value]) => (
            <div
              key={label}
              className="flex items-baseline justify-between gap-6 py-1.5 text-[13px] text-ink-600"
            >
              <span>{label}</span>
              <span className="tabular-nums text-ink-900">{value}</span>
            </div>
          ))}
          <div className="mt-2 flex items-baseline justify-between gap-6 border-t border-ink-900 pt-3">
            <span className="text-[11px] uppercase tracking-[0.18em]">
              {tCheckout("total")}
            </span>
            <span className="text-lg tabular-nums">
              {formatPrice(order.total, order.region)}
            </span>
          </div>
        </div>

        <p className="mt-10 text-xs leading-relaxed text-ink-500">
          {t("invoiceNote")}
        </p>
      </article>
    </div>
  );
}
