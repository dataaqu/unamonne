import { getTranslations } from "next-intl/server";

import {
  FULFILLMENT_DOT,
  PAYMENT_DOT,
} from "@/components/account/order-status";
import { SiteChrome } from "@/components/layout/site-chrome";
import { Btn, BtnLink } from "@/components/ui/btn";
import { Field, MicroLabel } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/notice";
import { addressLines } from "@/lib/account/address-format";
import { formatPrice } from "@/lib/money";
import {
  findOrderByReference,
  orderItemImage,
  orderReference,
} from "@/lib/orders";
import { localizedAlternates } from "@/lib/seo/metadata";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "OrderStatus" });

  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: localizedAlternates(locale, "/order-status"),
    // A lookup form has nothing to index and the results are somebody's order.
    robots: { index: false, follow: true },
  };
}

/**
 * Check an order without signing in.
 *
 * A plain GET form: the lookup is a URL, so it survives a refresh, works with
 * no client JavaScript and can be handed to someone over the phone. The email
 * is required alongside the reference — see `findOrderByReference` for why.
 */
export default async function OrderStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ reference?: string; email?: string }>;
}) {
  const [{ locale }, sp, t, tAccount, tCheckout] = await Promise.all([
    params,
    searchParams,
    getTranslations("OrderStatus"),
    getTranslations("Account"),
    getTranslations("Checkout"),
  ]);

  const reference = sp.reference?.trim() ?? "";
  const email = sp.email?.trim() ?? "";
  const searched = reference.length > 0 && email.length > 0;

  const order = searched
    ? await findOrderByReference(reference, email).catch(() => undefined)
    : undefined;

  const dateFmt = new Intl.DateTimeFormat(locale === "ka" ? "ka-GE" : "en-US", {
    dateStyle: "long",
  });

  return (
    <SiteChrome locale={locale} footer="slim">
      <div className="mx-auto w-full max-w-3xl px-6 py-14 lg:px-10 lg:py-20">
        <h1 className="text-4xl tracking-[-0.03em]">{t("title")}</h1>
        <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-ink-600">
          {t("subtitle")}
        </p>

        <form
          method="get"
          className="mt-10 grid gap-x-8 gap-y-7 border-t border-ink-200 pt-8 sm:grid-cols-2"
        >
          <Field
            label={t("reference")}
            name="reference"
            defaultValue={reference}
            placeholder="7EEBA295"
            maxLength={8}
            required
            className="tabular-nums"
            hint={t("referenceHint")}
          />
          <Field
            label={tAccount("email")}
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={email}
            required
          />
          <div className="sm:col-span-2">
            <Btn type="submit">{t("submit")}</Btn>
          </div>
        </form>

        {searched && !order ? (
          <EmptyState
            className="mt-10"
            title={t("notFound")}
            body={t("notFoundHint")}
            action={
              <BtnLink href="/account/orders" variant="outline">
                {t("signInInstead")}
              </BtnLink>
            }
          />
        ) : null}

        {order ? (
          <article className="mt-10 border border-ink-200 bg-white p-6 lg:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-ink-900 pb-5">
              <div>
                <MicroLabel>{t("orderLabel")}</MicroLabel>
                <div className="mt-1.5 font-mono text-sm">
                  {orderReference(order.id)}
                </div>
              </div>
              <div className="text-xs tabular-nums text-ink-500">
                {dateFmt.format(order.createdAt)}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-pill",
                    PAYMENT_DOT[order.paymentStatus],
                  )}
                />
                {tAccount(`paymentStatus.${order.paymentStatus}`)}
              </span>
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-pill",
                    FULFILLMENT_DOT[order.fulfillmentStatus],
                  )}
                />
                {tAccount(`fulfillmentStatus.${order.fulfillmentStatus}`)}
              </span>
              {order.trackingNumber ? (
                <span className="font-mono text-xs text-ink-600">
                  {tAccount("tracking")} {order.trackingNumber}
                </span>
              ) : null}
            </div>

            <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_220px]">
              <div>
                {order.items.map((item) => {
                  const image = orderItemImage(item);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 border-b border-ink-200 py-4 first:pt-0"
                    >
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={image.url}
                          alt={image.alt ?? item.nameSnapshot}
                          className="h-[68px] w-14 shrink-0 bg-accent-100 object-cover"
                        />
                      ) : (
                        <div className="h-[68px] w-14 shrink-0 bg-accent-100" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] uppercase tracking-[0.16em]">
                          {item.nameSnapshot}
                        </div>
                        <div className="mt-1 text-xs text-ink-500">
                          {[
                            item.variantLabel,
                            tAccount("qty", { count: item.quantity }),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      </div>
                      <span className="text-sm tabular-nums">
                        {formatPrice(
                          item.unitPrice * item.quantity,
                          order.region,
                        )}
                      </span>
                    </div>
                  );
                })}
                <div className="flex items-baseline justify-between pt-4">
                  <span className="text-[11px] uppercase tracking-[0.18em]">
                    {tCheckout("total")}
                  </span>
                  <span className="text-lg tabular-nums">
                    {formatPrice(order.total, order.region)}
                  </span>
                </div>
              </div>

              <aside className="text-[13px]">
                <MicroLabel>{tAccount("shippedTo")}</MicroLabel>
                <address className="mt-2 not-italic leading-relaxed text-ink-700">
                  {addressLines(
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
                  ).map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              </aside>
            </div>
          </article>
        ) : null}
      </div>
    </SiteChrome>
  );
}
