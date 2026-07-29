"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";

import {
  subscribeToNewsletterAction,
  type NewsletterState,
} from "@/lib/newsletter-actions";
import { cn } from "@/lib/utils";

/**
 * The seasonal-letter signup. On the cream field, so the input rule is the
 * cocoa hairline rather than the usual ink-300.
 */
export function NewsletterForm({
  source,
  className,
}: {
  source: string;
  className?: string;
}) {
  const t = useTranslations("Newsletter");
  const locale = useLocale();
  const [state, action, pending] = useActionState<
    NewsletterState | undefined,
    FormData
  >(subscribeToNewsletterAction, undefined);

  if (state?.ok) {
    return (
      <p className={cn("text-[13px] leading-relaxed text-ink-800", className)}>
        {t("done")}
      </p>
    );
  }

  return (
    <form action={action} className={cn("max-w-md", className)}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="source" value={source} />

      <div className="flex items-end gap-4">
        <label className="flex-1">
          <span className="text-[10px] uppercase tracking-[0.2em] text-ink-600">
            {t("email")}
          </span>
          <input
            type="email"
            name="email"
            required
            placeholder={t("placeholder")}
            className="mt-2 h-11 w-full rounded-none border-0 border-b border-ink-900/30 bg-transparent px-0 text-sm text-ink-900 placeholder:text-ink-500 focus:border-ink-900 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="h-11 shrink-0 bg-ink-900 px-6 text-[11px] uppercase tracking-[0.18em] text-ink-50 transition-colors hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2 disabled:bg-ink-300 disabled:text-ink-500"
        >
          {pending ? t("joining") : t("join")}
        </button>
      </div>

      {state && !state.ok ? (
        <p className="mt-2 text-xs text-danger-700" role="alert">
          {t(`errors.${state.error ?? "UNKNOWN"}`)}
        </p>
      ) : null}
    </form>
  );
}
