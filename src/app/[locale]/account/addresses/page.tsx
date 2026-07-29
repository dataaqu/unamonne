import { desc, eq } from "drizzle-orm";
import { getLocale, getTranslations } from "next-intl/server";

import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  deleteAddress,
  setDefaultAddress,
} from "@/lib/account/address-actions";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";

export default async function AccountAddressesPage() {
  const [session, locale, t] = await Promise.all([
    auth(),
    getLocale(),
    getTranslations("Account"),
  ]);
  const userId = session!.user.id;

  const list = await db.query.addresses.findMany({
    where: eq(addresses.userId, userId),
    orderBy: [desc(addresses.isDefault), desc(addresses.createdAt)],
  });

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("addressesTitle")}</h1>
        <Link
          href="/account/addresses/new"
          className={buttonVariants({ size: "sm" })}
        >
          {t("newAddress")}
        </Link>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noAddresses")}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {list.map((address) => (
            <li
              key={address.id}
              className="flex flex-col gap-3 rounded-lg border p-4 text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{address.fullName}</span>
                {address.isDefault ? (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {t("default")}
                  </span>
                ) : null}
              </div>

              <address className="not-italic text-muted-foreground">
                {address.line1}
                {address.line2 ? <>, {address.line2}</> : null}
                <br />
                {address.city}
                {address.postalCode ? <> {address.postalCode}</> : null}, {" "}
                {address.country}
                {address.phone ? (
                  <>
                    <br />
                    {address.phone}
                  </>
                ) : null}
              </address>

              <div className="mt-auto flex items-center gap-2">
                <Link
                  href={`/account/addresses/${address.id}/edit`}
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  {t("edit")}
                </Link>
                {address.isDefault ? null : (
                  <form action={setDefaultAddress}>
                    <input type="hidden" name="id" value={address.id} />
                    <input type="hidden" name="locale" value={locale} />
                    <Button variant="ghost" size="sm" type="submit">
                      {t("makeDefault")}
                    </Button>
                  </form>
                )}
                <form action={deleteAddress}>
                  <input type="hidden" name="id" value={address.id} />
                  <input type="hidden" name="locale" value={locale} />
                  <Button variant="ghost" size="sm" type="submit">
                    {t("delete")}
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
