import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { SiteChrome } from "@/components/layout/site-chrome";
import { CheckIcon } from "@/components/ui/icons";
import type { Locale } from "@/i18n/routing";
import {
  cartLineVariantLabel,
  cartTotals,
  lineUnitPrice,
} from "@/lib/cart";
import { getCartSafely } from "@/lib/cart-session";
import { pickTranslation } from "@/lib/catalog";
import { countryOptions } from "@/lib/countries";
import { quoteDiscount } from "@/lib/discounts";
import { formatPrice } from "@/lib/money";
import { getRegion } from "@/lib/region";
import { getShippingZones } from "@/lib/shipping";

import { CheckoutForm } from "./checkout-form";

/** Zones can be unreachable; checkout must still render its form. */
async function loadZones() {
  try {
    return await getShippingZones();
  } catch {
    return [];
  }
}

export default async function CheckoutPage() {
  const [t, locale, region, cart] = await Promise.all([
    getTranslations("Checkout"),
    getLocale() as Promise<Locale>,
    getRegion(),
    getCartSafely(),
  ]);

  if (!cart || cart.items.length === 0) {
    redirect(`/${locale}/cart`);
  }

  const { subtotal } = cartTotals(cart, region);
  const [discount, zones] = await Promise.all([
    quoteDiscount(cart.discountCode, subtotal, region).catch(() => null),
    loadZones(),
  ]);

  // Only narrow the country list when every destination is explicitly listed;
  // a fallback zone means the shop ships anywhere, so offer everywhere.
  const hasFallback = zones.some((zone) => zone.isFallback);
  const listed = zones.flatMap((zone) => zone.countries);
  const countries = countryOptions(locale, hasFallback ? undefined : listed);

  const payable = subtotal - (discount?.amount ?? 0);

  return (
    <SiteChrome
      locale={locale}
      header="slim"
      footer="slim"
      announcement={false}
    >
      {/* step rail */}
      <div className="border-b border-ink-200 px-6 py-4 lg:px-10">
        <ol className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.16em]">
          {[t("steps.bag"), t("steps.details"), t("steps.payment")].map(
            (step, index) => (
              <li key={step} className="flex items-center gap-3">
                <span
                  className={
                    index === 1
                      ? "flex h-5 w-5 items-center justify-center rounded-pill bg-ink-900 text-[10px] tabular-nums text-ink-50"
                      : index === 0
                        ? "flex h-5 w-5 items-center justify-center rounded-pill bg-ink-200 text-ink-700"
                        : "flex h-5 w-5 items-center justify-center rounded-pill border border-ink-300 text-[10px] tabular-nums text-ink-400"
                  }
                >
                  {index === 0 ? <CheckIcon className="h-3 w-3" /> : index + 1}
                </span>
                <span className={index === 1 ? "text-ink-900" : "text-ink-500"}>
                  {step}
                </span>
              </li>
            ),
          )}
        </ol>
      </div>

      <div className="mx-auto grid w-full max-w-[1600px] gap-12 px-6 py-10 lg:grid-cols-[1fr_400px] lg:gap-20 lg:px-10 lg:py-14">
        <section>
          <h1 className="text-3xl tracking-[-0.03em] sm:text-4xl">
            {t("title")}
          </h1>
          <CheckoutForm
            region={region}
            countries={countries}
            payLabel={t("pay", { total: formatPrice(payable, region) })}
          />
        </section>

        <aside className="h-fit lg:sticky lg:top-8">
          <div className="border border-ink-200 bg-white p-6">
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
              {t("summary")}
            </div>

            <div className="mt-5 space-y-4">
              {cart.items.map((line) => {
                const tr = pickTranslation(line.product.translations, locale);
                const image = [...line.product.images].sort(
                  (a, b) => a.sortOrder - b.sortOrder,
                )[0];
                const detail = cartLineVariantLabel(line);

                return (
                  <div key={line.id} className="flex gap-4">
                    <div className="relative shrink-0">
                      <div className="h-[76px] w-16 bg-accent-100">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={image.url}
                            alt={tr?.name ?? ""}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-pill bg-ink-900 text-[10px] tabular-nums text-ink-50">
                        {line.quantity}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] uppercase tracking-[0.16em]">
                        {tr?.name ?? "—"}
                      </div>
                      {detail ? (
                        <div className="mt-1 text-xs text-ink-500">
                          {detail}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-sm tabular-nums">
                      {formatPrice(
                        lineUnitPrice(line, region) * line.quantity,
                        region,
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 space-y-2.5 border-t border-ink-200 pt-5 text-[13px]">
              <div className="flex justify-between text-ink-600">
                <span>{t("subtotal")}</span>
                <span className="tabular-nums">
                  {formatPrice(subtotal, region)}
                </span>
              </div>
              {discount ? (
                <div className="flex justify-between text-success-700">
                  <span>{t("discount", { code: discount.code })}</span>
                  <span className="tabular-nums">
                    −{formatPrice(discount.amount, region)}
                  </span>
                </div>
              ) : null}
              {/* Shipping is priced from the address, which is still being
                  typed in the form beside this summary. */}
              <div className="flex justify-between text-ink-600">
                <span>{t("shipping")}</span>
                <span className="tabular-nums text-ink-400">—</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-ink-900 pt-3.5">
                <span className="text-[11px] uppercase tracking-[0.18em]">
                  {t("total")}
                </span>
                <span className="text-xl tabular-nums">
                  {formatPrice(payable, region)}
                </span>
              </div>
            </div>

            {cart.isGift ? (
              <p className="mt-4 border-t border-ink-200 pt-4 text-xs text-ink-500">
                {t("gift")}
              </p>
            ) : null}
          </div>

          <div className="mt-5 border border-ink-200 p-5 text-[12px] leading-relaxed text-ink-600">
            {region === "GE" ? t("deliveryGe") : t("deliveryIntl")}
          </div>
        </aside>
      </div>
    </SiteChrome>
  );
}
