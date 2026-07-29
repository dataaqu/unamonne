"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { MinusIcon, PlusIcon } from "@/components/ui/icons";
import {
  removeItemAction,
  setQuantityAction,
  type CartActionState,
} from "@/lib/cart-actions";

/**
 * Quantity stepper for one bag line. Each control is its own form posting a
 * server action, so it degrades to a plain POST without JavaScript — the bag
 * keeps working with scripting off.
 */
export function CartQuantity({
  itemId,
  quantity,
  maxQuantity,
}: {
  itemId: string;
  quantity: number;
  maxQuantity: number;
}) {
  const t = useTranslations("Cart");
  const [, setQuantity, pending] = useActionState<
    CartActionState | undefined,
    FormData
  >(setQuantityAction, undefined);

  return (
    <div className="inline-flex items-center border border-ink-300">
      <form action={setQuantity}>
        <input type="hidden" name="itemId" value={itemId} />
        <input type="hidden" name="quantity" value={quantity - 1} />
        <button
          type="submit"
          disabled={pending || quantity <= 1}
          aria-label={t("decrease")}
          className="flex h-10 w-10 items-center justify-center text-ink-700 transition-colors hover:bg-ink-200/60 disabled:text-ink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900"
        >
          <MinusIcon className="h-3.5 w-3.5" />
        </button>
      </form>

      <span className="w-9 text-center text-sm tabular-nums" aria-live="polite">
        {quantity}
      </span>

      <form action={setQuantity}>
        <input type="hidden" name="itemId" value={itemId} />
        <input type="hidden" name="quantity" value={quantity + 1} />
        <button
          type="submit"
          disabled={pending || quantity >= maxQuantity}
          aria-label={t("increase")}
          className="flex h-10 w-10 items-center justify-center text-ink-700 transition-colors hover:bg-ink-200/60 disabled:text-ink-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900"
        >
          <PlusIcon className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}

/** The quiet "Remove" under a line's details. */
export function CartRemove({ itemId }: { itemId: string }) {
  const t = useTranslations("Cart");
  const [, action, pending] = useActionState<
    CartActionState | undefined,
    FormData
  >(removeItemAction, undefined);

  return (
    <form action={action}>
      <input type="hidden" name="itemId" value={itemId} />
      <button
        type="submit"
        disabled={pending}
        className="text-[11px] uppercase tracking-[0.14em] text-ink-500 underline underline-offset-4 transition-colors hover:text-danger-600 disabled:opacity-50"
      >
        {t("remove")}
      </button>
    </form>
  );
}
