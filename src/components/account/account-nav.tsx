"use client";

import { useTranslations } from "next-intl";

import {
  BoxIcon,
  HeartIcon,
  PinIcon,
  UserIcon,
} from "@/components/ui/icons";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/account", key: "profile", Icon: UserIcon },
  { href: "/account/orders", key: "orders", Icon: BoxIcon },
  { href: "/account/addresses", key: "addresses", Icon: PinIcon },
  { href: "/account/saved", key: "saved", Icon: HeartIcon },
] as const;

/**
 * The account's side nav. The active room is filled solid rather than
 * underlined — inside the account the shopper is somewhere, not on the way.
 */
export function AccountNav() {
  const t = useTranslations("Account");
  const pathname = usePathname();

  return (
    <nav className="mt-5 space-y-1">
      {ITEMS.map(({ href, key, Icon }) => {
        const active =
          href === "/account" ? pathname === "/account" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 text-[13px] transition-colors",
              active
                ? "bg-ink-900 text-ink-50"
                : "text-ink-600 hover:bg-ink-200/60 hover:text-ink-900",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
