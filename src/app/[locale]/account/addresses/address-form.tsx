"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import type { AccountFormState } from "@/lib/account/form";

export type AddressInitial = {
  id?: string;
  fullName: string;
  phone: string;
  country: string;
  city: string;
  line1: string;
  line2: string;
  postalCode: string;
  isDefault: boolean;
};

const EMPTY: AddressInitial = {
  fullName: "",
  phone: "",
  country: "",
  city: "",
  line1: "",
  line2: "",
  postalCode: "",
  isDefault: false,
};

type Action = (
  prev: AccountFormState | undefined,
  formData: FormData,
) => Promise<AccountFormState>;

const TEXT_FIELDS = [
  { name: "fullName", required: true, autoComplete: "name" },
  { name: "phone", required: false, autoComplete: "tel" },
  { name: "country", required: true, autoComplete: "country" },
  { name: "city", required: true, autoComplete: "address-level2" },
  { name: "line1", required: true, autoComplete: "address-line1" },
  { name: "line2", required: false, autoComplete: "address-line2" },
  { name: "postalCode", required: false, autoComplete: "postal-code" },
] as const;

export function AddressForm({
  action,
  initial = EMPTY,
}: {
  action: Action;
  initial?: AddressInitial;
}) {
  const t = useTranslations("Account");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(action, { ok: false });

  const err = (field: string) =>
    state.fieldErrors?.[field]?.map((code) => (
      <p key={code} className="text-sm text-destructive">
        {code === "REQUIRED"
          ? t("required")
          : code === "COUNTRY_INVALID"
            ? t("countryInvalid")
            : code}
      </p>
    ));

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      <input type="hidden" name="locale" value={locale} />
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      {TEXT_FIELDS.map((field) => (
        <div key={field.name} className="space-y-1.5">
          <Label htmlFor={field.name}>{t(`field.${field.name}`)}</Label>
          <Input
            id={field.name}
            name={field.name}
            defaultValue={initial[field.name]}
            autoComplete={field.autoComplete}
            required={field.required}
            placeholder={field.name === "country" ? "GE" : undefined}
          />
          {err(field.name)}
        </div>
      ))}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={initial.isDefault}
          className="size-4"
        />
        {t("setAsDefault")}
      </label>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? t("saving") : t("save")}
        </Button>
        <Link
          href="/account/addresses"
          className={buttonVariants({ variant: "ghost" })}
        >
          {t("cancel")}
        </Link>
      </div>
    </form>
  );
}
