"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { CloseIcon, FilterIcon } from "@/components/ui/icons";
import { Overlay } from "@/components/ui/overlay";

/**
 * Mobile wrapper for the filter rail. The rail itself is server-rendered and
 * passed in as children — this only opens and closes it, so the filters keep
 * working (as plain links) even if this never hydrates.
 */
export function FilterDrawer({
  count,
  children,
}: {
  count: number;
  children: React.ReactNode;
}) {
  const t = useTranslations("Shop");
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
        className="inline-flex items-center gap-2 border border-ink-300 px-4 py-2.5 text-[11px] uppercase tracking-[0.16em] text-ink-700 transition-colors hover:border-ink-900 hover:text-ink-900"
      >
        <FilterIcon className="h-4 w-4" />
        {t("filters")}
      </button>

      {open ? (
        <Overlay>
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <button
              type="button"
              aria-label={t("closeSearch")}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-ink-950/40"
            />
            <aside
              role="dialog"
              aria-modal="true"
              aria-label={t("filters")}
              className="relative flex h-full w-full max-w-[340px] flex-col bg-ink-100 shadow-float"
            >
              <div className="flex items-center justify-between border-b border-ink-200 px-6 py-5">
                <span className="text-[11px] uppercase tracking-[0.2em]">
                  {t("filters")}
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-ink-600 hover:text-ink-900"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6">{children}</div>
              <div className="border-t border-ink-200 p-6">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-12 w-full bg-ink-900 text-[11px] uppercase tracking-[0.18em] text-ink-50"
                >
                  {t("showPieces", { count })}
                </button>
              </div>
            </aside>
          </div>
        </Overlay>
      ) : null}
    </>
  );
}
