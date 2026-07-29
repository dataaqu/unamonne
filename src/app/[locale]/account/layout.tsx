import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AccountNav } from "@/components/account/account-nav";
import { SiteChrome } from "@/components/layout/site-chrome";
import { auth } from "@/lib/auth";

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
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations("Account");

  return (
    <SiteChrome locale={locale} footer="slim">
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-8 px-6 py-10 lg:flex-row lg:gap-14 lg:px-10">
        <aside className="lg:w-56 lg:shrink-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
            {t("title")}
          </p>
          <AccountNav />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </SiteChrome>
  );
}
