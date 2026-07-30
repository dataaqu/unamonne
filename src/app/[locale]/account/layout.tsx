import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { logoutAction } from "@/app/[locale]/(auth)/actions";
import { AccountNav } from "@/components/account/account-nav";
import { SiteChrome } from "@/components/layout/site-chrome";
import { MicroLabel } from "@/components/ui/field";
import { SignOutIcon } from "@/components/ui/icons";
import { auth } from "@/lib/auth";
import { localePath } from "@/i18n/navigation";

/**
 * Customer account shell + guard. Any signed-in user may reach their own
 * account; only anonymous visitors are bounced to login. The account actions
 * re-check the user server-side, so this guard is UX, not the security boundary.
 */
export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(localePath(locale, "/login"));
  }

  const t = await getTranslations("Account");

  return (
    <SiteChrome locale={locale} footer="slim">
      <div className="mx-auto grid w-full max-w-[1600px] gap-10 px-6 py-12 lg:grid-cols-[220px_1fr] lg:gap-16 lg:px-10">
        <aside>
          <MicroLabel>{t("title")}</MicroLabel>
          <AccountNav />
          {/* A plain form, so signing out works with no client JavaScript. */}
          <form action={logoutAction} className="mt-6 border-t border-ink-200">
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-3 pt-5 text-[13px] text-ink-500 transition-colors hover:text-ink-900"
            >
              <SignOutIcon className="h-4 w-4" />
              {t("signOut")}
            </button>
          </form>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </SiteChrome>
  );
}
