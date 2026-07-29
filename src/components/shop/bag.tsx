import { getLocale, getTranslations } from "next-intl/server";

import { BagDrawer, type BagLine } from "@/components/shop/bag-drawer";
import { cartLineVariantLabel, cartTotals, lineUnitPrice } from "@/lib/cart";
import { getCartSafely } from "@/lib/cart-session";
import { pickTranslation } from "@/lib/catalog";
import { formatPrice } from "@/lib/money";
import { getRegion } from "@/lib/region";
import { getFreeShippingThreshold } from "@/lib/shipping";

/**
 * Server side of the header bag: resolves the cart, prices it in the active
 * region and hands the drawer plain strings. Every cart mutation calls
 * `refresh()`, so the count and the drawer contents update in the same
 * roundtrip as the action that changed them.
 */
export async function Bag({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [t, locale, region, cart] = await Promise.all([
    getTranslations("Cart"),
    getLocale(),
    getRegion(),
    getCartSafely(),
  ]);

  const { count, subtotal } = cartTotals(cart, region);
  const threshold = await getFreeShippingThreshold(region);

  const lines: BagLine[] = (cart?.items ?? []).map((line) => {
    const tr = pickTranslation(line.product.translations, locale);
    const image = [...line.product.images].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    )[0];

    return {
      id: line.id,
      name: tr?.name ?? "—",
      href: `/product/${tr?.slug ?? ""}`,
      imageUrl: image?.url ?? null,
      detail: cartLineVariantLabel(line),
      quantity: line.quantity,
      priceLabel: formatPrice(
        lineUnitPrice(line, region) * line.quantity,
        region,
      ),
    };
  });

  const shippingNote =
    threshold !== null
      ? t("freeOver", { amount: formatPrice(threshold, region) })
      : t("shippingAtCheckout");

  return (
    <BagDrawer
      lines={lines}
      count={count}
      subtotalLabel={formatPrice(subtotal, region)}
      shippingNote={shippingNote}
      tone={tone}
    />
  );
}
