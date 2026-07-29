import { getLocale, getTranslations } from "next-intl/server";

import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { deleteDiscount } from "@/lib/admin/discount-actions";
import { listDiscountCodes } from "@/lib/discounts";
import { formatPrice } from "@/lib/money";

export default async function AdminDiscountsPage() {
  const [locale, t, tf] = await Promise.all([
    getLocale(),
    getTranslations("Admin.discount"),
    getTranslations("Admin.form"),
  ]);

  const codes = await listDiscountCodes();
  const dateFmt = new Intl.DateTimeFormat(locale === "ka" ? "ka-GE" : "en-US", {
    dateStyle: "medium",
  });

  /** How much a code takes off, written the way an admin reads it. */
  function value(code: (typeof codes)[number]): string {
    if (code.percentOff !== null) return `${code.percentOff}%`;
    return [
      code.amountOffGel !== null ? formatPrice(code.amountOffGel, "GE") : null,
      code.amountOffUsd !== null ? formatPrice(code.amountOffUsd, "INTL") : null,
    ]
      .filter(Boolean)
      .join(" / ");
  }

  return (
    <main className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Link
          href="/admin/discounts/new"
          className={buttonVariants({ size: "sm" })}
        >
          {t("newCode")}
        </Link>
      </div>

      {codes.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tf("noItems")}</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th className="py-2 font-medium">{t("code")}</th>
              <th className="py-2 font-medium">{t("value")}</th>
              <th className="py-2 font-medium">{t("window")}</th>
              <th className="py-2 font-medium">{t("used")}</th>
              <th className="py-2 text-right font-medium">{tf("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((code) => (
              <tr key={code.id} className="border-b">
                <td className="py-2">
                  <span className="font-mono">{code.code}</span>
                  {!code.isActive ? (
                    <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs">
                      {t("inactive")}
                    </span>
                  ) : null}
                </td>
                <td className="py-2 tabular-nums">{value(code)}</td>
                <td className="py-2 text-muted-foreground">
                  {[
                    code.startsAt ? dateFmt.format(code.startsAt) : null,
                    code.expiresAt ? dateFmt.format(code.expiresAt) : null,
                  ]
                    .filter(Boolean)
                    .join(" → ") || "—"}
                </td>
                <td className="py-2 tabular-nums">
                  {code.redemptions}
                  {code.maxRedemptions !== null
                    ? ` / ${code.maxRedemptions}`
                    : ""}
                </td>
                <td className="py-2 text-right">
                  <Link
                    href={`/admin/discounts/${code.id}/edit`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    {tf("edit")}
                  </Link>
                  <form action={deleteDiscount} className="inline">
                    <input type="hidden" name="id" value={code.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <Button type="submit" variant="ghost" size="sm">
                      {tf("delete")}
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
