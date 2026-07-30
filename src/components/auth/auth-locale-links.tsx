"use client";

import { useLocale } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const NAMES: Record<string, string> = { ka: "ქართული", en: "English" };

/**
 * The two languages written out along the foot of the auth screens. Plain
 * anchors to the same page in the other locale — someone who landed on an
 * English sign-in from a Georgian link can switch without losing their place.
 */
export function AuthLocaleLinks() {
  const active = useLocale();
  const pathname = usePathname();

  return (
    <span className="flex gap-4">
      {routing.locales.map((locale) =>
        locale === active ? (
          <span key={locale} className="text-ink-900">
            {NAMES[locale] ?? locale}
          </span>
        ) : (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            className={cn("transition-colors hover:text-ink-900")}
          >
            {NAMES[locale] ?? locale}
          </Link>
        ),
      )}
    </span>
  );
}
