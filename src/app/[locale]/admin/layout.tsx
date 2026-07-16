import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AdminNav } from "@/components/admin/admin-nav";
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
    <div className="mx-auto flex w-full max-w-6xl flex-1">
      <aside className="w-56 shrink-0 border-r p-4">
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("title")}
        </p>
        <AdminNav />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
