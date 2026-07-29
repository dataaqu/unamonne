import { getLocale, getTranslations } from "next-intl/server";

import { SiteChrome } from "@/components/layout/site-chrome";
import { CopyButton } from "@/components/shop/copy-button";
import { ProductCard } from "@/components/shop/product-card";
import { ArrowLink, BtnLink } from "@/components/ui/btn";
import { BoxIcon, CheckIcon, MailIcon, TruckIcon } from "@/components/ui/icons";
import type { Locale } from "@/i18n/routing";
import { formatPrice } from "@/lib/money";
import { findOrderById } from "@/lib/orders";
import { getRegion } from "@/lib/region";
import { getVisibleProducts } from "@/lib/shop";
import { getSavedProductIds } from "@/lib/wishlist";

/** A public order reference, short enough to read down a phone line. */
function orderReference(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

async function safely<T>(load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load();
  } catch {
    return fallback;
  }
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const [sp, t, locale, region] = await Promise.all([
    searchParams,
    getTranslations("Checkout"),
    getLocale() as Promise<Locale>,
    getRegion(),
  ]);

  const order = sp.order
    ? await safely(() => findOrderById(sp.order!), undefined)
    : undefined;

  const [recommended, saved] = await Promise.all([
    safely(() => getVisibleProducts({ featuredOnly: true, limit: 4 }), []),
    getSavedProductIds(),
  ]);

  // The order carries its own currency (frozen at checkout), which is what was
  // actually charged — never re-price a placed order from the active region.
  const orderRegion = order?.region ?? region;
  const reference = order ? orderReference(order.id) : null;

  const steps = [
    {
      icon: <MailIcon className="h-4 w-4" />,
      title: t("success.stepEmail"),
      body: t("success.stepEmailBody", { email: order?.email ?? "" }),
      when: t("success.stepEmailWhen"),
    },
    {
      icon: <BoxIcon className="h-4 w-4" />,
      title: t("success.stepMade"),
      body: t("success.stepMadeBody"),
      when: t("success.stepMadeWhen"),
    },
    {
      icon: <TruckIcon className="h-4 w-4" />,
      title: t("success.stepShipped"),
      body: t("success.stepShippedBody"),
      when: t("success.stepShippedWhen"),
    },
  ];

  return (
    <SiteChrome locale={locale} header="slim" announcement={false}>
      {/* confirmation */}
      <section className="grid lg:grid-cols-[1.15fr_1fr]">
        <div className="px-6 py-16 lg:px-10 lg:py-24">
          <div className="flex h-12 w-12 items-center justify-center bg-brand-100 text-ink-900">
            <CheckIcon className="h-5 w-5" />
          </div>
          <h1 className="mt-8 max-w-lg text-4xl leading-[1] tracking-[-0.03em] text-balance sm:text-5xl">
            {t("success.title")}
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-[1.7] text-ink-700">
            {t("success.body", { email: order?.email ?? "" })}
          </p>

          {order ? (
            <div className="mt-9 flex flex-wrap items-stretch gap-4">
              <div className="border border-ink-200 bg-white px-5 py-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
                  {t("success.orderNumber")}
                </div>
                <div className="mt-1.5 flex items-center gap-4">
                  <span className="font-mono text-sm tabular-nums">
                    {reference}
                  </span>
                  <CopyButton
                    value={reference ?? ""}
                    label={t("success.copy")}
                    copiedLabel={t("success.copied")}
                  />
                </div>
              </div>
              <div className="border border-ink-200 bg-white px-5 py-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
                  {t("success.paid")}
                </div>
                <div className="mt-1.5 text-sm tabular-nums">
                  {formatPrice(order.total, orderRegion)} ·{" "}
                  {order.paymentProvider === "ipay"
                    ? t("regionGeNote")
                    : t("regionIntlNote")}
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-10 flex flex-wrap items-center gap-6">
            <BtnLink href="/account/orders" size="lg">
              {t("success.trackOrder")}
            </BtnLink>
            <ArrowLink href="/shop">{t("continue")}</ArrowLink>
          </div>
        </div>

        <div className="bg-ink-900 px-6 py-12 lg:px-10 lg:py-24">
          <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400">
            {t("success.whatNext")}
          </div>
          <ol className="mt-8 space-y-8">
            {steps.map((step) => (
              <li key={step.title} className="flex gap-5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-ink-700 text-ink-200">
                  {step.icon}
                </span>
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-4">
                    <span className="text-[13px] text-ink-50">
                      {step.title}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.14em] text-ink-500">
                      {step.when}
                    </span>
                  </div>
                  <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-ink-300">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* what was bought */}
      {order ? (
        <section className="mx-auto w-full max-w-[1600px] px-6 py-14 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-16">
            <div>
              <h2 className="border-b border-ink-900 pb-4 text-[11px] uppercase tracking-[0.2em]">
                {t("success.inThisOrder")}
              </h2>

              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-5 border-b border-ink-200 py-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] uppercase tracking-[0.16em]">
                      {item.nameSnapshot}
                    </div>
                    <div className="mt-1.5 text-xs text-ink-500">
                      {[
                        item.variantLabel,
                        item.engraving ? `“${item.engraving}”` : null,
                      ]
                        .filter(Boolean)
                        .map((part) => `${part} · `)
                        .join("")}
                      {t("itemCount", { count: item.quantity })}
                    </div>
                  </div>
                  <div className="text-sm tabular-nums">
                    {formatPrice(item.unitPrice * item.quantity, orderRegion)}
                  </div>
                </div>
              ))}

              <div className="space-y-2 py-5 text-[13px]">
                <div className="flex justify-between text-ink-600">
                  <span>{t("subtotal")}</span>
                  <span className="tabular-nums">
                    {formatPrice(order.subtotal, orderRegion)}
                  </span>
                </div>
                {order.discountAmount > 0 ? (
                  <div className="flex justify-between text-success-700">
                    <span>
                      {t("discount", { code: order.discountCode ?? "" })}
                    </span>
                    <span className="tabular-nums">
                      −{formatPrice(order.discountAmount, orderRegion)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between text-ink-600">
                  <span>{t("shipping")}</span>
                  <span className="tabular-nums">
                    {order.shippingCost === 0
                      ? t("free")
                      : formatPrice(order.shippingCost, orderRegion)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between border-t border-ink-900 pt-3.5">
                  <span className="text-[11px] uppercase tracking-[0.18em]">
                    {t("success.totalPaid")}
                  </span>
                  <span className="text-xl tabular-nums">
                    {formatPrice(order.total, orderRegion)}
                  </span>
                </div>
              </div>
            </div>

            <aside className="h-fit">
              <div className="border border-ink-200 bg-white p-6">
                <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
                  {t("success.shippingTo")}
                </div>
                <address className="mt-4 text-[13px] not-italic leading-relaxed text-ink-700">
                  {order.shipName}
                  <br />
                  {order.shipLine1}
                  {order.shipLine2 ? (
                    <>
                      <br />
                      {order.shipLine2}
                    </>
                  ) : null}
                  <br />
                  {[order.shipCity, order.shipPostalCode, order.shipCountry]
                    .filter(Boolean)
                    .join(", ")}
                  {order.shipPhone ? (
                    <>
                      <br />
                      {order.shipPhone}
                    </>
                  ) : null}
                </address>
                <p className="mt-5 border-t border-ink-200 pt-4 text-xs text-ink-500">
                  {t("success.addressNote")}
                </p>
              </div>

              <div className="mt-5 bg-brand-100 p-6">
                <div className="text-[13px]">{t("success.careTitle")}</div>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-700">
                  {t("success.careBody")}
                </p>
                <ArrowLink href="/blog" className="mt-5">
                  {t("success.careCta")}
                </ArrowLink>
              </div>
            </aside>
          </div>
        </section>
      ) : null}

      {/* keep browsing */}
      {recommended.length > 0 ? (
        <section className="mx-auto w-full max-w-[1600px] border-t border-ink-200 px-6 py-14 lg:px-10">
          <h2 className="text-3xl tracking-[-0.025em]">
            {t("success.goesWith")}
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4">
            {recommended.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                locale={locale}
                region={region}
                saved={saved.has(product.id)}
                imageClassName="h-[220px] sm:h-[280px]"
              />
            ))}
          </div>
        </section>
      ) : null}
    </SiteChrome>
  );
}
