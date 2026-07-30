"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useLocale, useTranslations } from "next-intl";

import { CheckIcon, ChevronIcon } from "@/components/ui/icons";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

const NAMES: Record<string, string> = { ka: "ქართული", en: "English" };

/**
 * KA / EN menu. The entries are real anchors to the current page in the other
 * locale — good for crawlers, and it still works if the menu never opens.
 *
 * It drops from under the button it belongs to: the card arrives first and the
 * two languages are written in after it, which is the same order the loader
 * and the lockup use. It leaves faster than it came, all at once.
 */
export function LocaleMenu({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const t = useTranslations("LanguageSwitcher");
  const activeLocale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const chevron = useRef<HTMLSpanElement>(null);
  // The card stays in the document while it is shut — a menu that is unmounted
  // the moment it closes has nothing left to animate — so the closed state is
  // set rather than played on the first pass. `autoAlpha` takes it out of the
  // tab order with it.
  const hasOpened = useRef(false);

  useGSAP(
    () => {
      const card = panel.current!;
      const entries = gsap.utils.toArray<HTMLElement>("[data-entry]", card);
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const pace = still ? 0 : 1;

      gsap.to(chevron.current, {
        rotate: open ? 180 : 0,
        duration: 0.34 * pace,
        ease: "power3.inOut",
      });

      if (open) {
        hasOpened.current = true;
        gsap
          .timeline()
          .fromTo(
            card,
            { autoAlpha: 0, y: -8, scale: 0.97 },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: 0.36 * pace,
              ease: "power3.out",
            },
            0,
          )
          .fromTo(
            entries,
            { autoAlpha: 0, y: -6 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.3 * pace,
              stagger: 0.07 * pace,
              ease: "power2.out",
            },
            0.08 * pace,
          );
        return;
      }

      if (!hasOpened.current) {
        gsap.set(card, { autoAlpha: 0 });
        gsap.set(entries, { autoAlpha: 0 });
        return;
      }

      gsap.to(card, {
        autoAlpha: 0,
        y: -6,
        scale: 0.98,
        duration: 0.24 * pace,
        ease: "power2.in",
      });
    },
    { dependencies: [open], scope: ref },
  );

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
        <span ref={chevron} className="block">
          <ChevronIcon className="h-3 w-3" />
        </span>
      </button>

      <div
        ref={panel}
        // The card grows down from the button, not out of its own middle.
        className="invisible absolute right-0 top-8 z-40 w-36 origin-top-right border border-ink-200 bg-ink-100 py-1 text-ink-900 shadow-pop"
      >
        {routing.locales.map((locale) => (
          <Link
            key={locale}
            data-entry
            href={pathname}
            locale={locale}
            onClick={() => setOpen(false)}
            aria-current={locale === activeLocale ? "true" : undefined}
            className={cn(
              "flex w-full items-center justify-between px-3.5 py-2 text-left text-[12px] transition-colors hover:bg-ink-200/60",
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
    </div>
  );
}
