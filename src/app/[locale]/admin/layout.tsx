import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AdminNav } from "@/components/admin/admin-nav";
import { SiteChrome } from "@/components/layout/site-chrome";
import { auth } from "@/lib/auth";

/**
 * Authoritative admin guard + panel shell. The guard is the real authorization
 * boundary (the proxy pre-check is only a UX fast-path).
 *
 * - No session → send to login.
 * - Signed in but not an admin → send home.
 */
export default async function AdminLayout({
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
  if (session.user.role !== "admin") {
    redirect(`/${locale}`);
  }

  const t = await getTranslations("Admin");

  return (
    <SiteChrome locale={locale} footer="slim">
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 px-6 lg:px-10">
        <aside className="hidden w-56 shrink-0 border-r border-ink-200 py-8 pr-6 sm:block">
          <p className="mb-4 text-[10px] uppercase tracking-[0.2em] text-ink-500">
            {t("title")}
          </p>
          <AdminNav />
        </aside>
        <div className="min-w-0 flex-1 py-8 sm:pl-8">{children}</div>
      </div>
    </SiteChrome>
  );
}
