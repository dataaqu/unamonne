import { getTranslations } from "next-intl/server";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { RegionSwitcher } from "@/components/region-switcher";
import { auth } from "@/lib/auth";

/**
 * Profile overview: identity plus the region/language preferences. Those
 * preferences are the same cookie-backed switchers as the header (they persist
 * across the site), surfaced here so the account is where a shopper manages them.
 */
export default async function AccountProfilePage() {
  const [session, t] = await Promise.all([
    auth(),
    getTranslations("Account"),
  ]);
  const user = session!.user;

  return (
    <main className="flex flex-1 flex-col gap-8 p-8">
      <h1 className="text-2xl font-semibold">{t("profileTitle")}</h1>

      <dl className="grid max-w-md gap-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t("email")}</dt>
          <dd className="font-medium">{user.email}</dd>
        </div>
        {user.name ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("name")}</dt>
            <dd className="font-medium">{user.name}</dd>
          </div>
        ) : null}
      </dl>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">{t("preferences")}</h2>
        <p className="text-sm text-muted-foreground">{t("preferencesHint")}</p>
        <div className="flex items-center gap-3">
          <RegionSwitcher />
          <LocaleSwitcher />
        </div>
      </section>
    </main>
  );
}
