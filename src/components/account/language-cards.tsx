"use client";

import { useLocale } from "next-intl";

import {
  PreferenceCardBody,
  preferenceCardClass,
} from "@/components/account/preference-card";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const NAMES: Record<string, string> = { ka: "ქართული", en: "English" };

/**
 * Language cards. Real anchors to the current page in the other locale — the
 * same contract as the header's switcher, so a shopper who changes language
 * here stays where they are instead of being dropped on the home page.
 */
export function LanguageCards() {
  const active = useLocale();
  const pathname = usePathname();
  const host = (process.env.NEXT_PUBLIC_APP_URL ?? "unamonne.ge")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  return (
    <div className="mt-3 space-y-2">
      {routing.locales.map((locale) => {
        const selected = locale === active;
        return (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            aria-current={selected ? "true" : undefined}
            className={preferenceCardClass(selected)}
          >
            <PreferenceCardBody
              label={NAMES[locale] ?? locale}
              note={`${host}/${locale}`}
              mono
              selected={selected}
            />
          </Link>
        );
      })}
    </div>
  );
}
