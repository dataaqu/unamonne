import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export async function SiteFooter() {
  const [t, tb] = await Promise.all([
    getTranslations("Shop"),
    getTranslations("Blog"),
  ]);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-6 text-sm text-muted-foreground">
        <span>© {year} Vintage</span>
        <nav className="flex items-center gap-4">
          <Link href="/shop" className="hover:text-foreground">
            {t("title")}
          </Link>
          <Link href="/blog" className="hover:text-foreground">
            {tb("title")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
