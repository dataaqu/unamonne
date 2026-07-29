import { getLocale, getTranslations } from "next-intl/server";

import { SiteChrome } from "@/components/layout/site-chrome";
import {
  CartQuantity,
  CartRemove,
} from "@/components/shop/cart-line-controls";
import { GiftToggle } from "@/components/shop/gift-toggle";
import { OfferCodeForm } from "@/components/shop/offer-code-form";
import { ArrowLink, BtnLink } from "@/components/ui/btn";
import { BagIcon, CheckIcon, MoonIcon, TruckIcon } from "@/components/ui/icons";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import {
  cartLineVariantLabel,
  cartTotals,
  lineUnitPrice,
} from "@/lib/cart";
import { getCartSafely } from "@/lib/cart-session";
import { pickTranslation } from "@/lib/catalog";
import { quoteDiscount } from "@/lib/discounts";
import { formatPrice } from "@/lib/money";
import { getRegion } from "@/lib/region";
import { getFreeShippingThreshold } from "@/lib/shipping";
import { availableStock } from "@/lib/shop";

export default async function CartPage() {
  const [t, locale, region, cart] = await Promise.all([
    getTranslations("Cart"),
    getLocale() as Promise<Locale>,
    getRegion(),
    getCartSafely(),
  ]);

  const lines = cart?.items ?? [];
  const { count, subtotal } = cartTotals(cart, region);

  // The offer code is re-priced against the live subtotal on every render, so
  // a code that no longer qualifies stops discounting instead of going stale.
  const [discount, threshold] = await Promise.all([
    quoteDiscount(cart?.discountCode, subtotal, region).catch(() => null),
    getFreeShippingThreshold(region),
  ]);

  const payable = subtotal - (discount?.amount ?? 0);
  const freeShipping = threshold !== null && payable >= threshold;
  const remaining = threshold !== null ? threshold - payable : 0;

  if (lines.length === 0) {
    return (
      <SiteChrome locale={locale} footer="slim">
        <div className="mx-auto w-full max-w-lg px-6 py-24 text-center">
          <div className="mx-auto flex w-fit text-ink-400">
            <BagIcon className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-2xl tracking-[-0.02em]">{t("empty")}</h1>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-600">
            {t("emptyBody")}
          </p>
          <div className="mt-8 flex justify-center">
            <BtnLink href="/shop" size="lg">
              {t("continueShopping")}
            </BtnLink>
          </div>
        </div>
      </SiteChrome>
    );
  }

  return (
    <SiteChrome locale={locale} footer="slim">
      <div className="mx-auto w-full max-w-[1600px] px-6 py-12 lg:px-10 lg:py-16">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-ink-900 pb-6">
          <h1 className="text-4xl tracking-[-0.03em] sm:text-5xl">
            {t("title")}
          </h1>
          <span className="text-[11px] uppercase tracking-[0.16em] tabular-nums text-ink-500">
            {t("items", { count })}
          </span>
        </div>

        <div className="grid gap-12 pt-8 lg:grid-cols-[1fr_360px] lg:gap-16">
          <section>
            <div className="hidden grid-cols-[1fr_auto_auto] gap-6 border-b border-ink-200 pb-2 text-[10px] uppercase tracking-[0.18em] text-ink-500 sm:grid">
              <span>{t("piece")}</span>
              <span>{t("quantity")}</span>
              <span className="text-right">{t("lineTotal")}</span>
            </div>

            {lines.map((line) => {
              const tr = pickTranslation(line.product.translations, locale);
              const image = [...line.product.images].sort(
                (a, b) => a.sortOrder - b.sortOrder,
              )[0];
              const unit = lineUnitPrice(line, region);
              const detail = cartLineVariantLabel(line);
              const stock = availableStock(line.product, line.variantId);

              return (
                <div
                  key={line.id}
                  className="grid grid-cols-[auto_1fr] items-start gap-5 border-b border-ink-200 py-6 sm:grid-cols-[1fr_auto_auto] sm:gap-6"
                >
                  <div className="col-span-2 flex gap-5 sm:col-span-1">
                    <Link
                      href={`/product/${tr?.slug ?? ""}`}
                      className="h-[136px] w-28 shrink-0 bg-accent-100"
                    >
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={image.url}
                          alt={tr?.name ?? ""}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </Link>

                    <div className="min-w-0">
                      <Link
                        href={`/product/${tr?.slug ?? ""}`}
                        className="text-[12px] uppercase tracking-[0.16em] underline-offset-4 hover:underline"
                      >
                        {tr?.name ?? "—"}
                      </Link>
                      {detail ? (
                        <div className="mt-1.5 text-xs text-ink-500">
                          {detail}
                        </div>
                      ) : null}
                      <div className="mt-3 text-sm tabular-nums">
                        {formatPrice(unit, region)}
                      </div>
                      {stock > 0 && stock <= 2 ? (
                        <div className="mt-3 text-[11px] text-warning-700">
                          {t("onlyLeft", { count: stock })}
                        </div>
                      ) : null}
                      <div className="mt-3">
                        <CartRemove itemId={line.id} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center sm:justify-center">
                    <CartQuantity
                      itemId={line.id}
                      quantity={line.quantity}
                      maxQuantity={Math.max(stock, line.quantity)}
                    />
                  </div>

                  <div className="text-right text-sm tabular-nums">
                    {formatPrice(unit * line.quantity, region)}
                  </div>
                </div>
              );
            })}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <ArrowLink href="/shop">{t("continueShopping")}</ArrowLink>
              <GiftToggle isGift={cart?.isGift ?? false} />
            </div>
          </section>

          <aside className="h-fit lg:sticky lg:top-24">
            <div className="border border-ink-200 bg-white p-6">
              <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
                {t("summary")}
              </div>

              <div className="mt-5 space-y-2.5 text-[13px]">
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

                <div className="flex justify-between text-ink-600">
                  <span>{t("shipping")}</span>
                  <span className="tabular-nums">
                    {freeShipping ? t("free") : t("shippingAtCheckout")}
                  </span>
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

              <OfferCodeForm applied={discount?.code ?? null} />

              <BtnLink href="/checkout" size="lg" full className="mt-6">
                {t("checkoutWith", { total: formatPrice(payable, region) })}
              </BtnLink>

              <p className="mt-3 text-center text-[11px] text-ink-500">
                {region === "GE" ? t("payWithGe") : t("payWithIntl")}
              </p>
            </div>

            <div className="mt-5 space-y-3 border border-ink-200 p-5 text-[12px] text-ink-600">
              {threshold !== null ? (
                <div className="flex items-center gap-3">
                  <TruckIcon className="h-4 w-4 shrink-0 text-ink-500" />
                  {freeShipping
                    ? t("freeUnlocked")
                    : t("spendMore", {
                        amount: formatPrice(remaining, region),
                      })}
                </div>
              ) : null}
              <div className="flex items-center gap-3">
                <CheckIcon className="h-4 w-4 shrink-0 text-ink-500" />
                {t("returnsNote")}
              </div>
              <div className="flex items-center gap-3">
                <MoonIcon className="h-4 w-4 shrink-0 text-ink-500" />
                {t("pouchNote")}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </SiteChrome>
  );
}
