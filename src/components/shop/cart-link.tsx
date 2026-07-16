import { getTranslations } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cartTotals } from "@/lib/cart";
import { getCartSafely } from "@/lib/cart-session";
import { getRegion } from "@/lib/region";

/**
 * Header cart link with a live item count. Cart mutations call `refresh()`, so
 * the count re-renders in the same roundtrip as the action.
 */
export async function CartLink() {
  const [t, region, cart] = await Promise.all([
    getTranslations("Cart"),
    getRegion(),
    getCartSafely(),
  ]);

  const { count } = cartTotals(cart, region);

  return (
    <Link
      href="/cart"
      className={buttonVariants({ variant: "ghost", size: "sm" })}
      aria-label={t("itemCount", { count })}
    >
      {t("title")}
      {count > 0 ? (
        <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground tabular-nums">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
