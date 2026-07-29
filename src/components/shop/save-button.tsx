"use client";

import { useActionState, useOptimistic, startTransition } from "react";
import { useTranslations } from "next-intl";

import { HeartIcon } from "@/components/ui/icons";
import {
  toggleWishlistAction,
  type WishlistState,
} from "@/lib/wishlist-actions";
import { cn } from "@/lib/utils";

/**
 * The heart on a product card.
 *
 * Optimistic: the fill flips the moment it is pressed and reconciles when the
 * action returns, because a save that visibly lags feels broken even though
 * nothing is wrong.
 */
export function SaveButton({
  productId,
  productName,
  saved,
  className,
  size = "card",
}: {
  productId: string;
  productName: string;
  saved: boolean;
  className?: string;
  size?: "card" | "detail";
}) {
  const t = useTranslations("Shop");
  const [, action] = useActionState<WishlistState | undefined, FormData>(
    toggleWishlistAction,
    undefined,
  );
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(saved);

  const label = optimisticSaved
    ? t("unsave", { name: productName })
    : t("save", { name: productName });

  return (
    <form
      action={(formData) => {
        startTransition(() => setOptimisticSaved(!optimisticSaved));
        action(formData);
      }}
      className={className}
    >
      <input type="hidden" name="productId" value={productId} />
      <button
        type="submit"
        aria-label={label}
        aria-pressed={optimisticSaved}
        className={cn(
          "flex items-center justify-center bg-ink-100/85 transition-opacity duration-200 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900",
          size === "card" ? "h-9 w-9" : "h-10 w-10",
          optimisticSaved
            ? "text-danger-600 opacity-100"
            : "text-ink-700 hover:text-ink-900 opacity-0 group-hover:opacity-100",
        )}
      >
        <HeartIcon
          filled={optimisticSaved}
          className={size === "card" ? "h-4 w-4" : "h-5 w-5"}
        />
      </button>
    </form>
  );
}
