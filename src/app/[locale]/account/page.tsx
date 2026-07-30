import { and, eq } from "drizzle-orm";
import { getLocale, getTranslations } from "next-intl/server";

import { LanguageCards } from "@/components/account/language-cards";
import {
  FULFILLMENT_DOT,
} from "@/components/account/order-status";
import {
  PreferenceCardBody,
  preferenceCardClass,
} from "@/components/account/preference-card";
import { ProfileEditor } from "@/components/account/profile-editor";
import { ArrowLink, BtnLink } from "@/components/ui/btn";
import { MicroLabel } from "@/components/ui/field";
import { addressLines } from "@/lib/account/address-format";
import { firstName } from "@/lib/account/profile-schema";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addresses, users } from "@/lib/db/schema";
import { formatPrice } from "@/lib/money";
import {
  findOrdersByUser,
  orderHistoryStats,
  orderItemImage,
  orderReference,
} from "@/lib/orders";
import { REGIONS, getRegion } from "@/lib/region";
import { setRegionAction } from "@/lib/region-actions";

/**
 * Profile overview: identity, the region + language preferences, and the two
 * things a returning shopper actually came to check — where the last order is,
 * and which address it would ship to next time.
 *
 * The preferences are the same cookie-backed controls as the header, surfaced
 * here as cards because the account is where a choice is explained, not just made.
 */
export default async function AccountProfilePage() {
  const [session, locale, t, tCheckout, region] = await Promise.all([
    auth(),
    getLocale(),
    getTranslations("Account"),
    getTranslations("Checkout"),
    getRegion(),
  ]);

  // The layout guard redirects an anonymous visitor, but this page can still be
  // rendered in the same pass — bail quietly instead of throwing on `user`.
  const userId = session?.user?.id;
  if (!userId) return null;

  const [user, orders, defaultAddress] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, userId) }),
    findOrdersByUser(userId),
    db.query.addresses.findFirst({
      where: and(eq(addresses.userId, userId), eq(addresses.isDefault, true)),
    }),
  ]);
  if (!user) return null;

  const stats = orderHistoryStats(orders);
  const latest = orders[0];
  const latestImage = latest ? orderItemImage(latest.items[0]) : null;

  const monthYear = new Intl.DateTimeFormat(locale === "ka" ? "ka-GE" : "en-US", {
    month: "long",
    year: "numeric",
  });
  const fullDate = new Intl.DateTimeFormat(locale === "ka" ? "ka-GE" : "en-US", {
    dateStyle: "long",
  });

  const REGION_COPY = {
    GE: { label: tCheckout("regionGe"), note: tCheckout("regionGeNote") },
    INTL: { label: tCheckout("regionIntl"), note: tCheckout("regionIntlNote") },
  } as const;

  return (
    <div>
      <ProfileEditor
        title={t("greeting", { name: firstName(user.name) || user.email })}
        meta={t("profileMeta", {
          since: monthYear.format(user.createdAt),
          orders: stats.orders,
          pieces: stats.pieces,
        })}
        name={user.name ?? ""}
        phone={user.phone ?? ""}
      />

      {/* details */}
      <section className="mt-10">
        <MicroLabel as="h2">{t("details")}</MicroLabel>
        <dl className="mt-5 max-w-xl border-t border-ink-200">
          {[
            [t("name"), user.name ?? "—"],
            [t("email"), user.email],
            [t("field.phone"), user.phone ?? "—"],
            [t("password"), "••••••••"],
          ].map(([key, value]) => (
            <div
              key={key}
              className="flex items-baseline justify-between gap-6 border-b border-ink-200 py-4"
            >
              <dt className="text-[13px] text-ink-500">{key}</dt>
              <dd className="text-[14px]">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* preferences */}
      <section className="mt-12">
        <MicroLabel as="h2">{t("preferences")}</MicroLabel>
        <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-ink-600">
          {t("preferencesHint")}
        </p>

        <div className="mt-6 grid max-w-2xl gap-8 sm:grid-cols-2">
          <div>
            <MicroLabel>{t("region")}</MicroLabel>
            {/* A plain form + server action: the choice is a cookie, and it
                survives with client JavaScript switched off. */}
            <form action={setRegionAction} className="mt-3 space-y-2">
              {REGIONS.map((option) => {
                const selected = option === region;
                return (
                  <button
                    key={option}
                    type="submit"
                    name="region"
                    value={option}
                    aria-pressed={selected}
                    className={preferenceCardClass(selected)}
                  >
                    <PreferenceCardBody
                      label={REGION_COPY[option].label}
                      note={REGION_COPY[option].note}
                      selected={selected}
                    />
                  </button>
                );
              })}
            </form>
          </div>

          <div>
            <MicroLabel>{t("language")}</MicroLabel>
            <LanguageCards />
          </div>
        </div>
      </section>

      {/* latest order + default address */}
      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="border border-ink-200 bg-white p-6">
          <div className="flex items-baseline justify-between gap-4">
            <MicroLabel>{t("latestOrder")}</MicroLabel>
            {latest ? (
              <span className="font-mono text-xs">
                {orderReference(latest.id)}
              </span>
            ) : null}
          </div>

          {latest ? (
            <>
              <div className="mt-4 flex gap-4">
                {latestImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={latestImage.url}
                    alt={latestImage.alt ?? latest.items[0]?.nameSnapshot ?? ""}
                    className="h-[76px] w-16 shrink-0 bg-accent-100 object-cover"
                  />
                ) : (
                  <div className="h-[76px] w-16 shrink-0 bg-accent-100" />
                )}
                <div className="flex-1 text-[13px]">
                  <div>
                    {t("orderSummary", {
                      name: latest.items[0]?.nameSnapshot ?? "",
                      count: Math.max(latest.items.length - 1, 0),
                    })}
                  </div>
                  <div className="mt-1.5 text-xs text-ink-500">
                    {t("placedOn", { date: fullDate.format(latest.createdAt) })}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-pill ${FULFILLMENT_DOT[latest.fulfillmentStatus]}`}
                    />
                    {t(`fulfillmentStatus.${latest.fulfillmentStatus}`)}
                    {latest.trackingNumber
                      ? ` · ${t("tracking")} ${latest.trackingNumber}`
                      : null}
                  </div>
                </div>
                <span className="text-sm tabular-nums">
                  {formatPrice(latest.total, latest.region)}
                </span>
              </div>
              <ArrowLink href="/account/orders" className="mt-5">
                {t("allOrders")}
              </ArrowLink>
            </>
          ) : (
            <>
              <p className="mt-4 text-[13px] leading-relaxed text-ink-600">
                {t("noOrders")}
              </p>
              <ArrowLink href="/shop" className="mt-5">
                {t("startShopping")}
              </ArrowLink>
            </>
          )}
        </div>

        <div className="border border-ink-200 bg-white p-6">
          <div className="flex items-baseline justify-between gap-4">
            <MicroLabel>{t("defaultAddress")}</MicroLabel>
            {defaultAddress ? (
              <span className="bg-ink-900 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-ink-50">
                {t("default")}
              </span>
            ) : null}
          </div>

          {defaultAddress ? (
            <>
              <address className="mt-4 text-[13px] not-italic leading-relaxed text-ink-700">
                {addressLines(defaultAddress, locale).map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
              <ArrowLink href="/account/addresses" className="mt-5">
                {t("manageAddresses")}
              </ArrowLink>
            </>
          ) : (
            <>
              <p className="mt-4 text-[13px] leading-relaxed text-ink-600">
                {t("noAddresses")}
              </p>
              <BtnLink
                href="/account/addresses"
                variant="outline"
                size="sm"
                className="mt-5"
              >
                {t("addAddress")}
              </BtnLink>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
