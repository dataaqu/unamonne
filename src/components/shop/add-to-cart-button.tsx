"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { addToCartAction, type CartActionState } from "@/lib/cart-actions";

/**
 * Add-to-cart form. The action re-renders the route in the same roundtrip, so
 * the header count updates without a client-side fetch.
 */
export function AddToCartButton({
  productId,
  disabled,
}: {
  productId: string;
  disabled?: boolean;
}) {
  const t = useTranslations("Cart");
  const [state, formAction, pending] = useActionState<
    CartActionState | undefined,
    FormData
  >(addToCartAction, undefined);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="productId" value={productId} />
      <Button type="submit" disabled={disabled || pending} className="w-full">
        {pending ? t("adding") : t("addToCart")}
      </Button>

      {state?.ok ? (
        <p className="text-sm text-green-600" role="status">
          {t("added")}
        </p>
      ) : null}
      {state && !state.ok ? (
        <p className="text-sm text-destructive" role="alert">
          {t(`errors.${state.error ?? "UNKNOWN"}`)}
        </p>
      ) : null}
    </form>
  );
}
