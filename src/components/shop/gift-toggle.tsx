"use client";

import { useTranslations } from "next-intl";

import { CheckIcon } from "@/components/ui/icons";
import { setGiftAction } from "@/lib/cart-actions";
import { cn } from "@/lib/utils";

/**
 * "This is a gift." A submit button rather than a checkbox: the choice is
 * stored on the cart, and carried onto the order, so it has to round-trip
 * rather than sit in client state that a refresh would lose.
 */
export function GiftToggle({ isGift }: { isGift: boolean }) {
  const t = useTranslations("Cart");

  return (
    <form action={setGiftAction}>
      {/* A checkbox posts "on" only when checked; invert the current value. */}
      {!isGift ? <input type="hidden" name="isGift" value="on" /> : null}
      <button
        type="submit"
        aria-pressed={isGift}
        className="flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2"
      >
        <span
          className={cn(
            "flex h-4 w-4 items-center justify-center border",
            isGift
              ? "border-ink-900 bg-ink-900 text-ink-50"
              : "border-ink-400 text-transparent",
          )}
        >
          <CheckIcon className="h-3 w-3" />
        </span>
        <span className="text-[13px] text-ink-700">{t("gift")}</span>
      </button>
    </form>
  );
}
