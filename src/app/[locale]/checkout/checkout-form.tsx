"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startCheckout, type CheckoutState } from "@/lib/checkout/actions";

const ADDRESS_FIELDS = [
  { name: "fullName", required: true, autoComplete: "name" },
  { name: "phone", required: false, autoComplete: "tel" },
  { name: "country", required: true, autoComplete: "country" },
  { name: "city", required: true, autoComplete: "address-level2" },
  { name: "line1", required: true, autoComplete: "address-line1" },
  { name: "line2", required: false, autoComplete: "address-line2" },
  { name: "postalCode", required: false, autoComplete: "postal-code" },
] as const;

const initial: CheckoutState = { ok: false };

export function CheckoutForm() {
  const t = useTranslations("Checkout");
  const tf = useTranslations("Account");
  const locale = useLocale();
  const [state, action, pending] = useActionState(startCheckout, initial);

  const fieldError = (field: string) =>
    state.fieldErrors?.[field]?.map((code) => (
      <p key={code} className="text-sm text-destructive">
        {code === "REQUIRED"
          ? tf("required")
          : code === "COUNTRY_INVALID"
            ? tf("countryInvalid")
            : code === "EMAIL_INVALID"
              ? t("emailInvalid")
              : code}
      </p>
    ));

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {t(`errors.${state.error}`)}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        {fieldError("email")}
      </div>

      <h2 className="pt-2 text-sm font-semibold">{t("shippingAddress")}</h2>

      {ADDRESS_FIELDS.map((field) => (
        <div key={field.name} className="space-y-1.5">
          <Label htmlFor={field.name}>{tf(`field.${field.name}`)}</Label>
          <Input
            id={field.name}
            name={field.name}
            autoComplete={field.autoComplete}
            required={field.required}
            placeholder={field.name === "country" ? "GE" : undefined}
          />
          {fieldError(field.name)}
        </div>
      ))}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t("paying") : t("pay")}
      </Button>
    </form>
  );
}
