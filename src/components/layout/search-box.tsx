"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { CloseIcon, SearchIcon } from "@/components/ui/icons";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Header search. Collapsed to an icon until asked for, then a single line that
 * submits to /shop?q= — the catalog page already filters on `q`, so a search is
 * a shareable URL rather than a modal with its own result list.
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

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

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("search")}
        className={cn("transition-opacity", iconTone)}
      >
        <SearchIcon />
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      role="search"
      className={cn(
        "flex items-center gap-2 border-b pb-1",
        tone === "dark" ? "border-ink-300" : "border-ink-50/50",
      )}
    >
      <SearchIcon className={cn("h-4 w-4", iconTone)} />
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("search")}
        className={cn(
          "w-32 border-0 bg-transparent p-0 text-xs focus:outline-none sm:w-44",
          tone === "dark"
            ? "text-ink-900 placeholder:text-ink-400"
            : "text-ink-50 placeholder:text-ink-200",
        )}
      />
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label={t("closeSearch")}
        className={iconTone}
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </form>
  );
}
