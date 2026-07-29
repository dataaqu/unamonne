import { asc } from "drizzle-orm";
import { getLocale, getTranslations } from "next-intl/server";

import { deleteCategory } from "@/lib/admin/category-actions";
import { pickTranslation } from "@/lib/catalog";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { categories } from "@/lib/db/schema";

export default async function AdminCategoriesPage() {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("Admin"),
  ]);

  const rows = await db.query.categories.findMany({
    with: { translations: true },
    orderBy: [asc(categories.sortOrder)],
  });

  return (
    <main className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("categories")}</h1>
        <Link
          href="/admin/categories/new"
          className={buttonVariants({ size: "sm" })}
        >
          {t("form.newCategory")}
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("form.noItems")}</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th className="py-2 font-medium">{t("form.name")}</th>
              <th className="py-2 font-medium">{t("form.visible")}</th>
              <th className="py-2 text-right font-medium">
                {t("form.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((category) => {
              const tr = pickTranslation(category.translations, locale);
              return (
                <tr key={category.id} className="border-b">
                  <td className="py-2">{tr?.name ?? "—"}</td>
                  <td className="py-2">{category.isVisible ? "✓" : "—"}</td>
                  <td className="py-2">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/categories/${category.id}/edit`}
                        className={buttonVariants({
                          variant: "ghost",
                          size: "sm",
                        })}
                      >
                        {t("form.edit")}
                      </Link>
                      <form action={deleteCategory}>
                        <input type="hidden" name="id" value={category.id} />
                        <input type="hidden" name="locale" value={locale} />
                        <Button variant="ghost" size="sm" type="submit">
                          {t("form.delete")}
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
