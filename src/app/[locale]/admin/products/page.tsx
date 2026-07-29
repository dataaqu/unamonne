import { asc } from "drizzle-orm";
import { getLocale, getTranslations } from "next-intl/server";

import { deleteProduct } from "@/lib/admin/product-actions";
import { pickTranslation } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { getRegion } from "@/lib/region";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { products } from "@/lib/db/schema";

export default async function AdminProductsPage() {
  const [locale, region, t] = await Promise.all([
    getLocale(),
    getRegion(),
    getTranslations("Admin"),
  ]);

  const rows = await db.query.products.findMany({
    with: { translations: true },
    orderBy: [asc(products.sortOrder)],
  });

  return (
    <main className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("products")}</h1>
        <Link
          href="/admin/products/new"
          className={buttonVariants({ size: "sm" })}
        >
          {t("form.newProduct")}
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("form.noItems")}</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th className="py-2 font-medium">{t("form.name")}</th>
              <th className="py-2 font-medium">{t("form.priceGel")}</th>
              <th className="py-2 text-right font-medium">
                {t("form.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((product) => {
              const tr = pickTranslation(product.translations, locale);
              const price =
                region === "GE" ? product.priceGel : product.priceUsd;
              return (
                <tr key={product.id} className="border-b">
                  <td className="py-2">
                    {tr?.name ?? "—"}
                    {product.isHidden ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({t("form.hidden")})
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2">{formatMoney(price, region, locale)}</td>
                  <td className="py-2">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className={buttonVariants({
                          variant: "ghost",
                          size: "sm",
                        })}
                      >
                        {t("form.edit")}
                      </Link>
                      <form action={deleteProduct}>
                        <input type="hidden" name="id" value={product.id} />
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
