"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { AccountHeader } from "@/components/account/account-header";
import {
  FULFILLMENT_DOT,
  PAYMENT_DOT,
  isOpenOrder,
} from "@/components/account/order-status";
import { Btn, BtnLink } from "@/components/ui/btn";
import { MicroLabel } from "@/components/ui/field";
import { BoxIcon, ChevronIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/notice";
import { Link } from "@/i18n/navigation";
import { reorderAction } from "@/lib/account/order-actions";
import type { Order } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export type OrderRow = {
  id: string;
  reference: string;
  date: string;
  total: string;
  paymentStatus: Order["paymentStatus"];
  fulfillmentStatus: Order["fulfillmentStatus"];
  tracking: string | null;
  shipTo: string[];
  items: {
    id: string;
    name: string;
    variant: string | null;
    quantity: number;
    total: string;
    image: string | null;
    alt: string;
  }[];
};

const FILTERS = ["all", "open", "completed"] as const;
type Filter = (typeof FILTERS)[number];

/**
 * Order history. One row per order, opened in place — an order is a receipt,
 * and a receipt should not cost a page load to read. The newest order starts
 * open because it is the one being checked on.
 */
export function OrdersList({
  orders,
  title,
  meta,
}: {
  orders: OrderRow[];
  title: string;
  meta: string;
}) {
  const t = useTranslations("Account");
  const tShop = useTranslations("Shop");
  const locale = useLocale();
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState(orders[0]?.id ?? "");

  const list = orders.filter((order) =>
    filter === "all"
      ? true
      : filter === "open"
        ? isOpenOrder(order.fulfillmentStatus)
        : !isOpenOrder(order.fulfillmentStatus),
  );

  return (
    <>
      <AccountHeader
        title={title}
        meta={meta}
        action={
          orders.length > 0 ? (
            <div className="inline-flex border border-ink-300">
              {FILTERS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  aria-pressed={filter === option}
                  className={cn(
                    "h-9 px-4 text-[11px] uppercase tracking-[0.14em] transition-colors",
                    filter === option
                      ? "bg-ink-900 text-ink-50"
                      : "text-ink-600 hover:bg-ink-200/60",
                  )}
                >
                  {t(`filter.${option}`)}
                </button>
              ))}
            </div>
          ) : null
        }
      />

      {list.length === 0 ? (
        <EmptyState
          className="mt-10"
          icon={<BoxIcon className="h-7 w-7" />}
          title={orders.length === 0 ? t("noOrders") : t("nothingUnderFilter")}
          action={
            orders.length === 0 ? (
              <BtnLink href="/shop" variant="outline">
                {tShop("allProducts")}
              </BtnLink>
            ) : (
              <Btn variant="outline" onClick={() => setFilter("all")}>
                {t("showAllOrders")}
              </Btn>
            )
          }
        />
      ) : (
        <div className="mt-8 space-y-4">
          {list.map((order) => {
            const isOpen = open === order.id;
            return (
              <article key={order.id} className="border border-ink-200 bg-white">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? "" : order.id)}
                  aria-expanded={isOpen}
                  className="flex w-full flex-wrap items-center justify-between gap-x-8 gap-y-3 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900"
                >
                  <div className="min-w-[180px]">
                    <div className="font-mono text-xs">{order.reference}</div>
                    <div className="mt-1.5 text-xs tabular-nums text-ink-500">
                      {order.date}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-pill",
                          PAYMENT_DOT[order.paymentStatus],
                        )}
                      />
                      {t(`paymentStatus.${order.paymentStatus}`)}
                    </span>
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-pill",
                          FULFILLMENT_DOT[order.fulfillmentStatus],
                        )}
                      />
                      {t(`fulfillmentStatus.${order.fulfillmentStatus}`)}
                    </span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-sm tabular-nums">{order.total}</span>
                    <ChevronIcon
                      className={cn(
                        "h-4 w-4 text-ink-500 transition-transform duration-300",
                        isOpen && "rotate-180",
                      )}
                    />
                  </div>
                </button>

                {isOpen ? (
                  <div className="border-t border-ink-200 p-5">
                    <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
                      <div>
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-4 border-b border-ink-200 py-4 first:pt-0"
                          >
                            {item.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.image}
                                alt={item.alt}
                                className="h-[68px] w-14 shrink-0 bg-accent-100 object-cover"
                              />
                            ) : (
                              <div className="h-[68px] w-14 shrink-0 bg-accent-100" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] uppercase tracking-[0.16em]">
                                {item.name}
                              </div>
                              <div className="mt-1 text-xs text-ink-500">
                                {[
                                  item.variant,
                                  t("qty", { count: item.quantity }),
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </div>
                            </div>
                            <span className="text-sm tabular-nums">
                              {item.total}
                            </span>
                          </div>
                        ))}
                        <div className="flex items-baseline justify-between pt-4">
                          <span className="text-[11px] uppercase tracking-[0.18em]">
                            {t("total")}
                          </span>
                          <span className="text-lg tabular-nums">
                            {order.total}
                          </span>
                        </div>
                      </div>

                      <aside className="space-y-5 text-[13px]">
                        <div>
                          <MicroLabel>{t("shippedTo")}</MicroLabel>
                          <address className="mt-2 not-italic leading-relaxed text-ink-700">
                            {order.shipTo.map((line) => (
                              <span key={line} className="block">
                                {line}
                              </span>
                            ))}
                          </address>
                        </div>

                        {order.tracking ? (
                          <div>
                            <MicroLabel>{t("tracking")}</MicroLabel>
                            <div className="mt-2 font-mono text-xs">
                              {order.tracking}
                            </div>
                          </div>
                        ) : null}

                        <div className="flex flex-col gap-2 pt-1">
                          <Link
                            href={`/account/orders/${order.id}/invoice`}
                            className="flex h-10 items-center justify-center border border-ink-900 px-4 text-[11px] uppercase tracking-[0.16em] transition-colors hover:bg-ink-900 hover:text-ink-50"
                          >
                            {t("invoiceDownload")}
                          </Link>
                          <form action={reorderAction}>
                            <input type="hidden" name="orderId" value={order.id} />
                            <input type="hidden" name="locale" value={locale} />
                            <button
                              type="submit"
                              className="h-10 w-full px-4 text-[11px] uppercase tracking-[0.16em] text-ink-600 transition-colors hover:bg-ink-200/60 hover:text-ink-900"
                            >
                              {t("buyAgain")}
                            </button>
                          </form>
                        </div>
                      </aside>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      <p className="mt-8 text-xs leading-relaxed text-ink-500">
        {t("historyNote")}
      </p>
    </>
  );
}
