import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AccountNav } from "@/components/account/account-nav";
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
    <div className="mx-auto flex w-full max-w-6xl flex-1">
      <aside className="w-56 shrink-0 border-r p-4">
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("title")}
        </p>
        <AccountNav />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
