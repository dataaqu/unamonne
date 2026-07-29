"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { CheckIcon, ChevronIcon } from "@/components/ui/icons";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const NAMES: Record<string, string> = { ka: "ქართული", en: "English" };

/**
 * KA / EN menu. The entries are real anchors to the current page in the other
 * locale — good for crawlers, and it still works if the menu never opens.
 */
export function LocaleMenu({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const t = useTranslations("LanguageSwitcher");
  const activeLocale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={t("label")}
        className={cn(
          "flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] transition-opacity focus-visible:outline-none focus-visible:ring-2",
          tone === "dark"
            ? "text-ink-700 hover:text-ink-900 focus-visible:ring-ink-900"
            : "text-ink-50 hover:opacity-75 focus-visible:ring-ink-50",
        )}
      >
        {activeLocale}
        <ChevronIcon className="h-3 w-3" />
      </button>

      {open ? (
        <div className="absolute right-0 top-8 z-40 w-36 border border-ink-200 bg-ink-100 py-1 text-ink-900 shadow-pop">
          {routing.locales.map((locale) => (
            <Link
              key={locale}
              href={pathname}
              locale={locale}
              onClick={() => setOpen(false)}
              aria-current={locale === activeLocale ? "true" : undefined}
              className={cn(
                "flex w-full items-center justify-between px-3.5 py-2 text-left text-[12px] hover:bg-ink-200/60",
                locale === activeLocale ? "text-ink-900" : "text-ink-600",
              )}
            >
              {NAMES[locale] ?? locale}
              {locale === activeLocale ? (
                <CheckIcon className="h-3.5 w-3.5" />
              ) : null}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
