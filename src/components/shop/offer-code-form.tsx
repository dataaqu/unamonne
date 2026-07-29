"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import {
  applyDiscountAction,
  removeDiscountAction,
  type DiscountActionState,
} from "@/lib/cart-actions";

/**
 * Offer-code box in the bag summary.
 *
 * The applied code comes from the server render rather than from this form's
 * own state: the code is re-priced against the live subtotal on every render,
 * so a code that stops qualifying (the bag dropped below its minimum) visibly
 * stops applying instead of lingering as a stale success message.
 */
export function OfferCodeForm({ applied }: { applied: string | null }) {
  const t = useTranslations("Cart");
  const [state, action, pending] = useActionState<
    DiscountActionState | undefined,
    FormData
  >(applyDiscountAction, undefined);

  if (applied) {
    return (
      <div className="mt-6 flex items-center justify-between gap-3 border-t border-ink-200 pt-5">
        <span className="text-[13px] text-success-700">
          {t("offerApplied", { code: applied })}
        </span>
        <form action={removeDiscountAction}>
          <button
            type="submit"
            className="text-[11px] uppercase tracking-[0.14em] text-ink-500 underline underline-offset-4 hover:text-ink-900"
          >
            {t("offerRemove")}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-ink-200 pt-5">
      <form action={action} className="flex items-end gap-3">
        <label className="flex-1">
          <span className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
            {t("offerCode")}
          </span>
          <input
            name="code"
            required
            placeholder={t("offerPlaceholder")}
            className="mt-2 h-10 w-full rounded-none border-0 border-b border-ink-300 bg-transparent px-0 text-sm uppercase text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="h-10 shrink-0 border border-ink-900 px-4 text-[11px] uppercase tracking-[0.16em] transition-colors hover:bg-ink-900 hover:text-ink-50 disabled:border-ink-200 disabled:text-ink-400"
        >
          {t("apply")}
        </button>
      </form>

      {state && !state.ok ? (
        <p className="mt-2 text-xs text-ink-500" role="alert">
          {t(`offerErrors.${state.error ?? "UNKNOWN"}`)}
        </p>
      ) : null}
    </div>
  );
}
