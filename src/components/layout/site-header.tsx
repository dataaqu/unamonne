import { getTranslations } from "next-intl/server";

import { LogoutButton } from "@/components/auth/logout-button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { RegionSwitcher } from "@/components/region-switcher";
import { CartLink } from "@/components/shop/cart-link";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";

/**
 * Top navigation shell: brand, region + language switchers, and auth state
 * (login link when signed out; admin link + logout when signed in).
 */
export async function SiteHeader() {
  const [session, t] = await Promise.all([auth(), getTranslations("Auth")]);

  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Vintage
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <RegionSwitcher />
          <LocaleSwitcher />
          <CartLink />

          {session?.user ? (
            <div className="flex items-center gap-1">
              {session.user.role === "admin" ? (
                <Link
                  href="/admin"
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  Admin
                </Link>
              ) : null}
              <LogoutButton />
            </div>
          ) : (
            <Link
              href="/login"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {t("login")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
