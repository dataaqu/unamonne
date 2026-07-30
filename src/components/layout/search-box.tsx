"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useTranslations } from "next-intl";

import { CloseIcon, SearchIcon } from "@/components/ui/icons";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

/**
 * Header search. Collapsed to an icon until asked for, then a single line that
 * submits to /shop?q= — the catalog page already filters on `q`, so a search is
 * a shareable URL rather than a modal with its own result list.
 *
 * It opens the way the house draws everything else: a rule pulls out from under
 * the icon and the field arrives on it. The icon itself does not move — it sits
 * at the end of the header row, and the line grows to its left, so the account
 * and the bag stay exactly where the hand left them.
 */
export function SearchBox({
  tone = "dark",
  initialQuery = "",
}: {
  tone?: "dark" | "light";
  initialQuery?: string;
}) {
  const t = useTranslations("Shop");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialQuery);

  const field = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const glass = useRef<HTMLSpanElement>(null);
  const cross = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const width = open ? (window.innerWidth < 640 ? 148 : 196) : 0;
      const time = still ? 0 : 0.42;

      gsap.to(field.current, {
        width,
        duration: time,
        ease: "power3.inOut",
      });
      // Opacity, not autoAlpha: autoAlpha hides visibility, and a hidden input
      // cannot take focus — the caret would land nowhere.
      gsap.to(input.current, {
        opacity: open ? 1 : 0,
        duration: still ? 0 : 0.3,
        delay: open && !still ? 0.12 : 0,
      });

      // One button, two faces: the glass turns out as the cross turns in.
      gsap.to(glass.current, {
        autoAlpha: open ? 0 : 1,
        rotate: open ? -90 : 0,
        duration: time,
        ease: "power3.inOut",
      });
      gsap.to(cross.current, {
        autoAlpha: open ? 1 : 0,
        rotate: open ? 0 : 90,
        duration: time,
        ease: "power3.inOut",
      });

      // The field is taken out of the accessibility tree when it closes, so the
      // caret must not be left sitting inside it.
      if (open) input.current?.focus();
      else input.current?.blur();
    },
    { dependencies: [open] },
  );

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const term = value.trim();
    router.push(term ? `/shop?q=${encodeURIComponent(term)}` : "/shop");
    setOpen(false);
  }

  const iconTone =
    tone === "dark"
      ? "text-ink-700 hover:text-ink-900"
      : "text-ink-50 hover:opacity-75";

  return (
    <form
      onSubmit={submit}
      role="search"
      className="flex items-center gap-2"
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <div
        ref={field}
        className={cn(
          "w-0 overflow-hidden border-b pb-1",
          tone === "dark" ? "border-ink-300" : "border-ink-50/50",
        )}
      >
        <input
          ref={input}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("search")}
          tabIndex={open ? 0 : -1}
          aria-hidden={!open}
          className={cn(
            "w-[140px] border-0 bg-transparent p-0 text-xs opacity-0 focus:outline-none sm:w-[188px]",
            tone === "dark"
              ? "text-ink-900 placeholder:text-ink-400"
              : "text-ink-50 placeholder:text-ink-200",
          )}
        />
      </div>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? t("closeSearch") : t("search")}
        aria-expanded={open}
        className={cn("relative block h-5 w-5 transition-opacity", iconTone)}
      >
        <span ref={glass} className="absolute inset-0 block">
          <SearchIcon />
        </span>
        <span ref={cross} className="absolute inset-0 block opacity-0">
          <CloseIcon />
        </span>
      </button>
    </form>
  );
}
