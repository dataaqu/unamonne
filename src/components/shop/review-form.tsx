"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import { StarIcon } from "@/components/ui/icons";
import { Notice } from "@/components/ui/notice";
import { submitReviewAction, type ReviewState } from "@/lib/review-actions";
import { cn } from "@/lib/utils";

/**
 * Leave (or amend) a review. Signed-in only — the server enforces it; this
 * component is simply not rendered for a signed-out visitor, who gets a link to
 * sign in instead.
 */
export function ReviewForm({
  productId,
  variantLabels,
  existing,
}: {
  productId: string;
  variantLabels: string[];
  existing?: { rating: number; body: string; variantLabel: string | null } | null;
}) {
  const t = useTranslations("Product");
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [state, action, pending] = useActionState<
    ReviewState | undefined,
    FormData
  >(submitReviewAction, undefined);

  if (state?.ok) {
    return (
      <Notice tone="success" role="status" className="mt-6">
        {t("reviewThanks")}
      </Notice>
    );
  }

  return (
    <form action={action} className="mt-8 border-t border-ink-200 pt-8">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />

      <h3 className="text-[11px] uppercase tracking-[0.2em] text-ink-500">
        {existing ? t("editReview") : t("writeReview")}
      </h3>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
          {t("rating")}
        </span>
        <span className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={t("ratingStars", { count: value })}
              aria-pressed={rating === value}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900"
            >
              <StarIcon
                className={cn(
                  "h-4 w-4 transition-colors",
                  value <= rating ? "text-brand-500" : "text-ink-300",
                )}
              />
            </button>
          ))}
        </span>
      </div>

      {variantLabels.length > 0 ? (
        <label className="mt-5 block max-w-xs">
          <span className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
            {t("size")}
          </span>
          <select
            name="variantLabel"
            defaultValue={existing?.variantLabel ?? ""}
            className="mt-2 h-11 w-full appearance-none rounded-none border-0 border-b border-ink-300 bg-transparent px-0 text-sm text-ink-900 focus:border-ink-900 focus:outline-none"
          >
            <option value="">—</option>
            {variantLabels.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="mt-5 block">
        <span className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
          {t("reviewBody")}
        </span>
        <textarea
          name="body"
          rows={4}
          required
          minLength={10}
          defaultValue={existing?.body ?? ""}
          placeholder={t("reviewPlaceholder")}
          className="mt-2 w-full resize-none rounded-none border border-ink-300 bg-transparent p-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:outline-none"
        />
      </label>

      {state && !state.ok ? (
        <p className="mt-3 text-xs text-danger-700" role="alert">
          {t(`reviewErrors.${state.error ?? "UNKNOWN"}`)}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 h-11 bg-ink-900 px-6 text-[11px] uppercase tracking-[0.18em] text-ink-50 transition-colors hover:bg-ink-800 disabled:bg-ink-200 disabled:text-ink-400"
      >
        {pending ? t("submittingReview") : t("submitReview")}
      </button>
    </form>
  );
}
