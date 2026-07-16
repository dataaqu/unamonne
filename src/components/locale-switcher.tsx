"use client";

import { useLocale, useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Language switcher (KA/EN). Renders real anchors to the current page in the
 * other locale (good for SEO/crawlers) using next-intl's locale-aware Link.
 */
export function LocaleSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const activeLocale = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label={t("label")} className="flex items-center gap-0.5 text-sm">
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          href={pathname}
          locale={locale}
          aria-current={locale === activeLocale ? "true" : undefined}
          className={cn(
            "rounded px-2 py-1 uppercase transition-colors",
            locale === activeLocale
              ? "font-semibold text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {locale}
        </Link>
      ))}
    </nav>
  );
}
