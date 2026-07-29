import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { cartTotals } from "@/lib/cart";
import { getCartSafely } from "@/lib/cart-session";
import { formatMoney } from "@/lib/money";
import { getRegion } from "@/lib/region";

import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage() {
  const [t, locale, region, cart] = await Promise.all([
    getTranslations("Checkout"),
    getLocale(),
    getRegion(),
    getCartSafely(),
  ]);

  if (!cart || cart.items.length === 0) {
    redirect(`/${locale}/cart`);
  }

  const { subtotal, count } = cartTotals(cart, region);

  return (
    <main className="mx-auto grid w-full max-w-4xl flex-1 gap-10 px-4 py-8 lg:grid-cols-[1fr_320px]">
      <section>
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <CheckoutForm />
      </section>

      <aside className="h-fit rounded-lg border p-5 text-sm">
        <h2 className="mb-3 font-semibold">{t("summary")}</h2>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            {t("itemCount", { count })}
          </span>
          <span className="tabular-nums">
            {formatMoney(subtotal, region, locale)}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("shippingNote")}
        </p>
      </aside>
    </main>
  );
}
