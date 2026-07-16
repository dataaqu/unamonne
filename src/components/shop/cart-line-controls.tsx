"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  removeItemAction,
  setQuantityAction,
  type CartActionState,
} from "@/lib/cart-actions";

/**
 * Quantity stepper + remove for one cart line. Each control is its own form so
 * it degrades to a plain POST without JavaScript.
 */
export function CartLineControls({
  itemId,
  quantity,
  maxQuantity,
}: {
  itemId: string;
  quantity: number;
  maxQuantity: number;
}) {
  const t = useTranslations("Cart");
  const [, setQuantity, settingQuantity] = useActionState<
    CartActionState | undefined,
    FormData
  >(setQuantityAction, undefined);
  const [, removeItem, removing] = useActionState<
    CartActionState | undefined,
    FormData
  >(removeItemAction, undefined);

  const busy = settingQuantity || removing;

  return (
    <div className="flex items-center gap-2">
      <form action={setQuantity} className="flex items-center gap-1">
        <input type="hidden" name="itemId" value={itemId} />
        <input type="hidden" name="quantity" value={quantity - 1} />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={busy || quantity <= 1}
          aria-label={t("decrease")}
        >
          −
        </Button>
      </form>

      <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
        {quantity}
      </span>

      <form action={setQuantity} className="flex items-center gap-1">
        <input type="hidden" name="itemId" value={itemId} />
        <input type="hidden" name="quantity" value={quantity + 1} />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={busy || quantity >= maxQuantity}
          aria-label={t("increase")}
        >
          +
        </Button>
      </form>

      <form action={removeItem}>
        <input type="hidden" name="itemId" value={itemId} />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          disabled={busy}
          className="text-muted-foreground"
        >
          {t("remove")}
        </Button>
      </form>
    </div>
  );
}
