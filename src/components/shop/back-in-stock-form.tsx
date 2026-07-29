"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Notice } from "@/components/ui/notice";
import {
  requestBackInStockAction,
  type BackInStockState,
} from "@/lib/back-in-stock-actions";
import { cn } from "@/lib/utils";

/**
 * "Write to me when it is back", shown only on a piece (or a size) that cannot
 * currently be bought. Asking twice is a no-op server-side, so the form never
 * has to guard against a double submit.
 */
export function BackInStockForm({
  productId,
  variantId,
  locale,
  className,
}: {
  productId: string;
  variantId?: string | null;
  locale: string;
  className?: string;
}) {
  const t = useTranslations("Product");
  const [state, action, pending] = useActionState<
    BackInStockState | undefined,
    FormData
  >(requestBackInStockAction, undefined);

  if (state?.ok) {
    return (
      <Notice tone="success" role="status" className={className}>
        {t("notifySent")}
      </Notice>
    );
  }

  return (
    <form action={action} className={cn("border border-ink-200 p-5", className)}>
      <input type="hidden" name="productId" value={productId} />
      {variantId ? (
        <input type="hidden" name="variantId" value={variantId} />
      ) : null}
      <input type="hidden" name="locale" value={locale} />

      <div className="text-[13px] text-ink-900">{t("notifyTitle")}</div>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-500">
        {t("notifyBody")}
      </p>

      <div className="mt-4 flex items-end gap-3">
        <label className="flex-1">
          <span className="sr-only">{t("notifyTitle")}</span>
          <input
            type="email"
            name="email"
            required
            placeholder="nino@example.ge"
            className="h-10 w-full rounded-none border-0 border-b border-ink-300 bg-transparent px-0 text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="h-10 border border-ink-900 px-4 text-[11px] uppercase tracking-[0.16em] transition-colors hover:bg-ink-900 hover:text-ink-50 disabled:border-ink-200 disabled:text-ink-400"
        >
          {t("notifySend")}
        </button>
      </div>

      {state && !state.ok ? (
        <p className="mt-2 text-xs text-danger-700" role="alert">
          {t(`notifyErrors.${state.error ?? "UNKNOWN"}`)}
        </p>
      ) : null}
    </form>
  );
}
