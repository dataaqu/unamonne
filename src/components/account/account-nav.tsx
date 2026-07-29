"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/account", key: "profile" },
  { href: "/account/saved", key: "saved" },
  { href: "/account/addresses", key: "addresses" },
  { href: "/account/orders", key: "orders" },
] as const;

export function AccountNav() {
  const t = useTranslations("Account");
  const pathname = usePathname();

  return (
    <nav className="mt-4 flex gap-x-6 overflow-x-auto lg:flex-col lg:gap-x-0 lg:overflow-visible">
      {ITEMS.map((item) => {
        const active =
          item.href === "/account"
            ? pathname === "/account"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 border-b py-2 text-[13px] transition-colors lg:border-b-0 lg:border-l lg:px-3",
              active
                ? "border-ink-900 text-ink-900"
                : "border-transparent text-ink-500 hover:text-ink-900 lg:border-ink-200",
            )}
          >
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
