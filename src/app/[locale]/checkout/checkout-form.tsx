"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Field, SelectField } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { startCheckout, type CheckoutState } from "@/lib/checkout/actions";
import type { Region } from "@/lib/currency";
import { setRegionAction } from "@/lib/region-actions";
import { cn } from "@/lib/utils";

const initial: CheckoutState = { ok: false };

/**
 * Contact, shipping address and payment.
 *
 * The region choice is its own little form: it writes the REGION cookie, so the
 * currency, the totals in the summary beside this form and the payment rail all
 * move together on the next render — one source of truth, rather than a
 * duplicate "which currency" field inside the order form that could disagree
 * with the prices the shopper is looking at.
 */
export function CheckoutForm({
  region,
  countries,
  payLabel,
}: {
  region: Region;
  countries: { code: string; name: string }[];
  payLabel: string;
}) {
  const t = useTranslations("Checkout");
  const tf = useTranslations("Account");
  const locale = useLocale();
  const [state, action, pending] = useActionState(startCheckout, initial);
  const [country, setCountry] = useState(region === "GE" ? "GE" : "");

  const fieldError = (field: string) => {
    const codes = state.fieldErrors?.[field];
    if (!codes?.length) return undefined;
    const code = codes[0];
    if (code === "REQUIRED") return tf("required");
    if (code === "COUNTRY_INVALID") return tf("countryInvalid");
    if (code === "EMAIL_INVALID") return t("emailInvalid");
    return code;
  };

  return (
    <>
      <div className="mt-8 border-t border-ink-200 pt-7">
        <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
          {t("shippingTo")}
        </div>
        <form
          action={setRegionAction}
          className="mt-4 grid gap-3 sm:grid-cols-2"
        >
          {(
            [
              ["GE", t("regionGe"), t("regionGeNote")],
              ["INTL", t("regionIntl"), t("regionIntlNote")],
            ] as const
          ).map(([value, name, note]) => {
            const active = region === value;
            return (
              <button
                key={value}
                type="submit"
                name="region"
                value={value}
                aria-pressed={active}
                className={cn(
                  "flex items-start justify-between gap-4 border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2",
                  active
                    ? "border-ink-900 bg-white"
                    : "border-ink-200 hover:border-ink-400",
                )}
              >
                <span>
                  <span className="block text-[13px]">{name}</span>
                  <span className="mt-1 block text-xs text-ink-500">
                    {note}
                  </span>
                </span>
                <span
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-pill border",
                    active ? "border-ink-900" : "border-ink-400",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-pill",
                      active ? "bg-ink-900" : "bg-transparent",
                    )}
                  />
                </span>
              </button>
            );
          })}
        </form>
      </div>

      <form action={action} className="mt-10">
        <input type="hidden" name="locale" value={locale} />

        {state.error ? (
          <Notice tone="danger" role="alert" className="mb-6">
            {t(`errors.${state.error}`)}
          </Notice>
        ) : null}

        <h2 className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
          {t("contact")}
        </h2>
        <Field
          className="mt-4 max-w-md"
          label={t("email")}
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="nino@example.ge"
          hint={t("emailHint")}
          error={fieldError("email")}
        />

        <h2 className="mt-10 text-[10px] uppercase tracking-[0.2em] text-ink-500">
          {t("shippingAddress")}
        </h2>
        <div className="mt-4 grid gap-x-8 gap-y-7 sm:grid-cols-2">
          <Field
            label={tf("field.fullName")}
            name="fullName"
            autoComplete="name"
            required
            error={fieldError("fullName")}
          />
          <Field
            label={tf("field.phone")}
            name="phone"
            autoComplete="tel"
            optional
            error={fieldError("phone")}
          />
          <SelectField
            label={tf("field.country")}
            name="country"
            required
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            error={fieldError("country")}
          >
            <option value="">—</option>
            {countries.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.name}
              </option>
            ))}
          </SelectField>
          <Field
            label={tf("field.city")}
            name="city"
            autoComplete="address-level2"
            required
            error={fieldError("city")}
          />
          <Field
            className="sm:col-span-2"
            label={tf("field.line1")}
            name="line1"
            autoComplete="address-line1"
            required
            error={fieldError("line1")}
          />
          <Field
            className="sm:col-span-2"
            label={tf("field.line2")}
            name="line2"
            autoComplete="address-line2"
            optional
            error={fieldError("line2")}
          />
          <Field
            label={tf("field.postalCode")}
            name="postalCode"
            autoComplete="postal-code"
            optional
            error={fieldError("postalCode")}
          />
        </div>

        <h2 className="mt-10 border-t border-ink-200 pt-8 text-[10px] uppercase tracking-[0.2em] text-ink-500">
          {t("payment")}
        </h2>
        <div className="mt-4 border border-ink-900 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[13px]">
                {region === "GE" ? t("paymentGe") : t("paymentIntl")}
              </div>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-ink-500">
                {region === "GE" ? t("paymentGeNote") : t("paymentIntlNote")}
              </p>
            </div>
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-pill border border-ink-900">
              <span className="h-1.5 w-1.5 rounded-pill bg-ink-900" />
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-8 h-14 w-full max-w-md bg-ink-900 text-xs uppercase tracking-[0.18em] text-ink-50 transition-colors hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2 disabled:bg-ink-300 disabled:text-ink-500"
        >
          {pending ? t("paying") : payLabel}
        </button>
        <p className="mt-3 max-w-md text-xs text-ink-500">{t("terms")}</p>
      </form>
    </>
  );
}
