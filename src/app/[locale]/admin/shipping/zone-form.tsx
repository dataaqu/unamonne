"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import type { AdminFormState } from "@/lib/admin/form";

export type ZoneInitial = {
  id?: string;
  name: string;
  countries: string;
  isGeorgia: boolean;
  isFallback: boolean;
  sortOrder: number;
  rateGel: string;
  freeThresholdGel: string;
  rateUsd: string;
  freeThresholdUsd: string;
};

const EMPTY: ZoneInitial = {
  name: "",
  countries: "",
  isGeorgia: false,
  isFallback: false,
  sortOrder: 0,
  rateGel: "",
  freeThresholdGel: "",
  rateUsd: "",
  freeThresholdUsd: "",
};

type Action = (
  prev: AdminFormState | undefined,
  formData: FormData,
) => Promise<AdminFormState>;

const CURRENCIES = [
  { code: "GEL", rate: "rateGel", free: "freeThresholdGel" },
  { code: "USD", rate: "rateUsd", free: "freeThresholdUsd" },
] as const;

export function ZoneForm({
  action,
  initial = EMPTY,
}: {
  action: Action;
  initial?: ZoneInitial;
}) {
  const t = useTranslations("Admin.shipping");
  const tf = useTranslations("Admin.form");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(action, { ok: false });

  const err = (field: string) =>
    state.fieldErrors?.[field]?.map((code) => (
      <p key={code} className="text-sm text-destructive">
        {code === "REQUIRED" ? tf("required") : code}
      </p>
    ));

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <input type="hidden" name="locale" value={locale} />
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div className="space-y-1.5">
        <Label htmlFor="name">{tf("name")}</Label>
        <Input id="name" name="name" defaultValue={initial.name} required />
        {err("name")}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="countries">{t("countries")}</Label>
        <Input
          id="countries"
          name="countries"
          defaultValue={initial.countries}
          placeholder={t("countriesHint")}
        />
        <p className="text-xs text-muted-foreground">{t("countriesHelp")}</p>
      </div>

      {CURRENCIES.map(({ code, rate, free }) => (
        <fieldset key={code} className="space-y-3 rounded-lg border p-4">
          <legend className="px-1 text-sm font-medium">
            {t("rateIn", { currency: code })}
          </legend>
          <div className="flex gap-4">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor={rate}>{t("rate")}</Label>
              <Input
                id={rate}
                name={rate}
                type="number"
                min={0}
                defaultValue={initial[rate]}
                placeholder={t("rateBlankHint")}
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor={free}>{t("freeThreshold")}</Label>
              <Input
                id={free}
                name={free}
                type="number"
                min={0}
                defaultValue={initial[free]}
                placeholder={t("freeThresholdHint")}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t("minorUnitsHelp")}</p>
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isGeorgia"
            defaultChecked={initial.isGeorgia}
            className="size-4"
          />
          {t("isGeorgia")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isFallback"
            defaultChecked={initial.isFallback}
            className="size-4"
          />
          {t("isFallback")}
        </label>
        <div className="flex items-center gap-2">
          <Label htmlFor="sortOrder">{tf("sortOrder")}</Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={initial.sortOrder}
            className="w-20"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? tf("saving") : tf("save")}
        </Button>
        <Link
          href="/admin/shipping"
          className={buttonVariants({ variant: "ghost" })}
        >
          {tf("cancel")}
        </Link>
      </div>
    </form>
  );
}
