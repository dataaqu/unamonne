import { getLocale, getTranslations } from "next-intl/server";

import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { deleteZone } from "@/lib/admin/shipping-actions";
import { getShippingZones } from "@/lib/shipping";

export default async function AdminShippingPage() {
  const [locale, t, tf] = await Promise.all([
    getLocale(),
    getTranslations("Admin.shipping"),
    getTranslations("Admin.form"),
  ]);

  const zones = await getShippingZones();

  const hasFallback = zones.some((zone) => zone.isFallback);

  return (
    <main className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Link
          href="/admin/shipping/new"
          className={buttonVariants({ size: "sm" })}
        >
          {t("newZone")}
        </Link>
      </div>

      {zones.length > 0 && !hasFallback ? (
        <p className="rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {t("noFallbackWarning")}
        </p>
      ) : null}

      {zones.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tf("noItems")}</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th className="py-2 font-medium">{tf("name")}</th>
              <th className="py-2 font-medium">{t("countries")}</th>
              <th className="py-2 font-medium">{t("rates")}</th>
              <th className="py-2 text-right font-medium">{tf("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((zone) => (
              <tr key={zone.id} className="border-b align-top">
                <td className="py-2">
                  <span className="font-medium">{zone.name}</span>
                  <span className="ml-2 space-x-1">
                    {zone.isGeorgia ? (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {t("isGeorgia")}
                      </span>
                    ) : null}
                    {zone.isFallback ? (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {t("isFallback")}
                      </span>
                    ) : null}
                  </span>
                </td>
                <td className="py-2 text-muted-foreground">
                  {zone.countries.length > 0
                    ? zone.countries.join(", ")
                    : t("anyCountry")}
                </td>
                <td className="py-2">
                  {zone.rates.length === 0 ? (
                    <span className="text-destructive">{t("noRates")}</span>
                  ) : (
                    <ul className="space-y-0.5">
                      {zone.rates.map((rate) => (
                        <li key={rate.id} className="tabular-nums">
                          {rate.currency} {(rate.rate / 100).toFixed(2)}
                          {rate.freeThreshold !== null ? (
                            <span className="ml-1 text-muted-foreground">
                              {t("freeOver", {
                                amount: (rate.freeThreshold / 100).toFixed(2),
                              })}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="py-2">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/shipping/${zone.id}/edit`}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "sm",
                      })}
                    >
                      {tf("edit")}
                    </Link>
                    <form action={deleteZone}>
                      <input type="hidden" name="id" value={zone.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <Button variant="ghost" size="sm" type="submit">
                        {tf("delete")}
                      </Button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
