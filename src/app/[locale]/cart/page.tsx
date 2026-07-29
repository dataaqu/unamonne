import { getLocale, getTranslations } from "next-intl/server";

import { CartLineControls } from "@/components/shop/cart-line-controls";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cartTotals, lineUnitPrice } from "@/lib/cart";
import { getCartSafely } from "@/lib/cart-session";
import { pickTranslation } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { getRegion } from "@/lib/region";

export default async function CartPage() {
  const [t, locale, region, cart] = await Promise.all([
    getTranslations("Cart"),
    getLocale(),
    getRegion(),
    getCartSafely(),
  ]);

  const lines = cart?.items ?? [];
  const { subtotal } = cartTotals(cart, region);

  if (lines.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("empty")}</p>
        <Link href="/shop" className={buttonVariants()}>
          {t("continueShopping")}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        {t("title")}
      </h1>

      <ul className="divide-y border-y">
        {lines.map((line) => {
          const tr = pickTranslation(line.product.translations, locale);
          const image = [...line.product.images].sort(
            (a, b) => a.sortOrder - b.sortOrder,
          )[0];
          const unit = lineUnitPrice(line, region);

          return (
            <li key={line.id} className="flex items-center gap-4 py-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image.url}
                    alt={tr?.name ?? ""}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <Link
                  href={`/product/${tr?.slug ?? ""}`}
                  className="block truncate font-medium hover:underline"
                >
                  {tr?.name ?? "—"}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {formatMoney(unit, region, locale)}
                </p>
                <CartLineControls
                  itemId={line.id}
                  quantity={line.quantity}
                  maxQuantity={line.product.stock}
                />
              </div>

              <p className="shrink-0 text-sm font-medium tabular-nums">
                {formatMoney(unit * line.quantity, region, locale)}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-muted-foreground">{t("subtotal")}</span>
        <span className="text-xl font-semibold tabular-nums">
          {formatMoney(subtotal, region, locale)}
        </span>
      </div>

      <p className="mt-1 text-right text-xs text-muted-foreground">
        {t("shippingAtCheckout")}
      </p>

      <div className="mt-6 flex justify-end gap-2">
        <Link
          href="/shop"
          className={buttonVariants({ variant: "outline" })}
        >
          {t("continueShopping")}
        </Link>
        <Link href="/checkout" className={buttonVariants()}>
          {t("checkout")}
        </Link>
      </div>
    </main>
  );
}
