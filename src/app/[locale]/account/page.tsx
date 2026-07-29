import { getTranslations } from "next-intl/server";

import { CurrencyToggle } from "@/components/layout/currency-toggle";
import { LocaleMenu } from "@/components/layout/locale-menu";
import { auth } from "@/lib/auth";

/**
 * Profile overview: identity plus the region/language preferences. Those
 * preferences are the same cookie-backed controls as the header (they persist
 * across the site), surfaced here so the account is where a shopper manages them.
 */
export default async function AccountProfilePage() {
  const [session, t] = await Promise.all([auth(), getTranslations("Account")]);

  // The layout guard redirects an anonymous visitor, but this page can still be
  // rendered in the same pass — bail quietly instead of throwing on `user`.
  const user = session?.user;
  if (!user) return null;

  return (
    <div className="flex flex-1 flex-col gap-10">
      <h1 className="text-3xl tracking-[-0.025em]">{t("profileTitle")}</h1>

      <dl className="max-w-md border-t border-ink-200">
        <div className="flex items-baseline justify-between gap-4 border-b border-ink-200 py-3 text-[13px]">
          <dt className="text-ink-500">{t("email")}</dt>
          <dd>{user.email}</dd>
        </div>
        {user.name ? (
          <div className="flex items-baseline justify-between gap-4 border-b border-ink-200 py-3 text-[13px]">
            <dt className="text-ink-500">{t("name")}</dt>
            <dd>{user.name}</dd>
          </div>
        ) : null}
      </dl>

      <section className="flex flex-col gap-3">
        <h2 className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
          {t("preferences")}
        </h2>
        <p className="max-w-md text-[13px] leading-relaxed text-ink-600">
          {t("preferencesHint")}
        </p>
        <div className="mt-2 flex items-center gap-5">
          <CurrencyToggle />
          <LocaleMenu />
        </div>
      </section>
    </div>
  );
}
