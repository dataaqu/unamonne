"use client";

import { useTranslations } from "next-intl";

import { scoreSeo, type SeoInput } from "@/lib/seo/scorer";

/** Live SEO score for one locale, recomputed as the author types (T5.3). */
export function SeoPanel({ input }: { input: SeoInput }) {
  const t = useTranslations("Admin.blog.seo");
  const { score, checks } = scoreSeo(input);

  const tone =
    score >= 80
      ? "text-emerald-600"
      : score >= 50
        ? "text-amber-600"
        : "text-destructive";

  return (
    <div className="rounded-lg border p-4 text-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-medium">{t("score")}</span>
        <span className={`font-semibold tabular-nums ${tone}`}>{score}/100</span>
      </div>
      <ul className="space-y-1">
        {checks.map((check) => (
          <li
            key={check.id}
            className={
              check.ok ? "text-emerald-600" : "text-muted-foreground"
            }
          >
            {check.ok ? "✓" : "○"} {t(`check.${check.id}`)}
          </li>
        ))}
      </ul>
    </div>
  );
}
