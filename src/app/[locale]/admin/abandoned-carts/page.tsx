import { getLocale, getTranslations } from "next-intl/server";

import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { sendOfferEmail } from "@/lib/admin/abandoned-cart-actions";
import {
  filterByEmailed,
  findAbandonedCartsForAdmin,
  hasBeenEmailed,
} from "@/lib/abandoned-cart";
import { cartTotals } from "@/lib/cart";
import { pickTranslation } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";

export default async function AdminAbandonedCartsPage({
  searchParams,
}: {
  searchParams: Promise<{ emailed?: string }>;
}) {
  const [sp, locale, t] = await Promise.all([
    searchParams,
    getLocale(),
    getTranslations("Admin.abandoned"),
  ]);

  const emailedFilter =
    sp.emailed === "yes" ? true : sp.emailed === "no" ? false : undefined;
  const carts = filterByEmailed(await findAbandonedCartsForAdmin(), emailedFilter);

  const dateFmt = new Intl.DateTimeFormat(locale === "ka" ? "ka-GE" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const filters = [
    { value: "", key: "all" },
    { value: "no", key: "notEmailed" },
    { value: "yes", key: "emailed" },
  ] as const;

  return (
    <main className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <div className="flex gap-2 text-sm">
        {filters.map((f) => {
          const active = (sp.emailed ?? "") === f.value;
          return (
            <Link
              key={f.key}
              href={f.value ? `/admin/abandoned-carts?emailed=${f.value}` : "/admin/abandoned-carts"}
              className={buttonVariants({
                variant: active ? "secondary" : "ghost",
                size: "sm",
              })}
            >
              {t(f.key)}
            </Link>
          );
        })}
      </div>

      {carts.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noCarts")}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {carts.map((cart) => {
            const { count, subtotal } = cartTotals(cart, cart.region);
            const emailed = hasBeenEmailed(cart);
            const lastEmail = cart.emails
              .map((e) => e.sentAt)
              .sort((a, b) => b.getTime() - a.getTime())[0];

            return (
              <li key={cart.id} className="rounded-lg border p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {cart.email ?? t("noContact")}
                    </p>
                    <p className="text-muted-foreground">
                      {t("idleSince", { when: dateFmt.format(cart.updatedAt) })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium tabular-nums">
                      {formatMoney(subtotal, cart.region, locale)}
                    </p>
                    <p className="text-muted-foreground">
                      {t("itemCount", { count })}
                    </p>
                  </div>
                </div>

                <ul className="mt-3 space-y-0.5 text-muted-foreground">
                  {cart.items.map((line) => {
                    const tr = pickTranslation(line.product.translations, locale);
                    return (
                      <li key={line.id}>
                        {line.quantity}× {tr?.name ?? "—"}
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {emailed
                      ? t("emailedTimes", {
                          count: cart.emails.length,
                          when: lastEmail ? dateFmt.format(lastEmail) : "",
                        })
                      : t("notEmailedYet")}
                  </p>
                  <form action={sendOfferEmail}>
                    <input type="hidden" name="cartId" value={cart.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <Button
                      type="submit"
                      variant={emailed ? "ghost" : "default"}
                      size="sm"
                      disabled={!cart.email}
                    >
                      {emailed ? t("resend") : t("send")}
                    </Button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
