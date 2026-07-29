"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { addToCartAction, type CartActionState } from "@/lib/cart-actions";

/**
 * The "add to bag" bar that slides up over a product card. Only rendered for a
 * piece with no sizes to choose — anything with variants sends the shopper to
 * the product page instead, because picking a ring size from a thumbnail is not
 * a decision a card should make for them.
 */
export function QuickAdd({ productId }: { productId: string }) {
  const t = useTranslations("Cart");
  const [state, action, pending] = useActionState<
    CartActionState | undefined,
    FormData
  >(addToCartAction, undefined);

  return (
    <form action={action} className="absolute inset-x-0 bottom-0">
      <input type="hidden" name="productId" value={productId} />
      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full translate-y-full bg-ink-900 text-[11px] uppercase tracking-[0.18em] text-ink-50 transition-transform duration-300 focus-visible:translate-y-0 focus-visible:outline-none group-hover:translate-y-0 disabled:opacity-80"
      >
        {pending
          ? t("adding")
          : state && !state.ok
            ? t(`errors.${state.error ?? "UNKNOWN"}`)
            : t("addToCart")}
      </button>
    </form>
  );
}
