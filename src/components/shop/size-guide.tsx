"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { CloseIcon, RulerIcon } from "@/components/ui/icons";

/**
 * Ring-size reference. The mm figures are a physical standard (circumference
 * = size in mm), so they are computed rather than typed out — a table of
 * hand-entered numbers is a table with a typo in it.
 */
const SIZES = Array.from({ length: 8 }, (_, i) => {
  const circumference = 14 + i;
  return {
    label: String(circumference),
    circumference: `${(circumference * 3.2 + 4.5).toFixed(1)} mm`,
    diameter: `${((circumference * 3.2 + 4.5) / Math.PI).toFixed(1)} mm`,
  };
});

export function SizeGuide({
  onPick,
  selectedLabel,
}: {
  onPick?: (label: string) => void;
  selectedLabel?: string | null;
}) {
  const t = useTranslations("Product");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-ink-600 underline underline-offset-4 transition-colors hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2"
      >
        <RulerIcon className="h-4 w-4" />
        {t("sizeGuide")}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <button
            type="button"
            aria-label={t("sizeGuide")}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink-950/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("sizeGuide")}
            className="relative max-h-full w-full max-w-md overflow-auto bg-ink-100 shadow-float"
          >
            <div className="flex items-center justify-between border-b border-ink-200 px-6 py-5">
              <span className="text-[11px] uppercase tracking-[0.2em]">
                {t("sizeGuide")}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-ink-600 hover:text-ink-900"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-[13px] leading-relaxed text-ink-700">
                {t("sizeGuideBody")}
              </p>
              <div className="mt-5">
                <div className="grid grid-cols-3 border-b border-ink-900 pb-2 text-[10px] uppercase tracking-[0.18em] text-ink-500">
                  <span>{t("size")}</span>
                  <span>⌀</span>
                  <span>mm</span>
                </div>
                {SIZES.map((row) => (
                  <button
                    key={row.label}
                    type="button"
                    onClick={() => {
                      onPick?.(row.label);
                      setOpen(false);
                    }}
                    className={`grid w-full grid-cols-3 border-b border-ink-200 py-2.5 text-left text-[13px] tabular-nums transition-colors hover:bg-ink-200/50 ${
                      row.label === selectedLabel ? "text-ink-900" : "text-ink-600"
                    }`}
                  >
                    <span className="text-ink-900">{row.label}</span>
                    <span>{row.circumference}</span>
                    <span>{row.diameter}</span>
                  </button>
                ))}
              </div>
              <p className="mt-4 text-xs text-ink-500">{t("sizeGuideHint")}</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
