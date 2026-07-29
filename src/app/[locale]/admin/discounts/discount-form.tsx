"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import type { AdminFormState } from "@/lib/admin/form";

export type DiscountInitial = {
  id?: string;
  code: string;
  percentOff: string;
  amountOffGel: string;
  amountOffUsd: string;
  minSubtotalGel: string;
  minSubtotalUsd: string;
  maxRedemptions: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
};

const EMPTY: DiscountInitial = {
  code: "",
  percentOff: "",
  amountOffGel: "",
  amountOffUsd: "",
  minSubtotalGel: "",
  minSubtotalUsd: "",
  maxRedemptions: "",
  startsAt: "",
  expiresAt: "",
  isActive: true,
};

type Action = (
  prev: AdminFormState | undefined,
  formData: FormData,
) => Promise<AdminFormState>;

export function DiscountForm({
  action,
  initial = EMPTY,
}: {
  action: Action;
  initial?: DiscountInitial;
}) {
  const t = useTranslations("Admin.discount");
  const tf = useTranslations("Admin.form");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(action, { ok: false });

  const err = (field: string) =>
    state.fieldErrors?.[field]?.map((code) => (
      <p key={code} className="text-sm text-destructive">
        {code === "REQUIRED"
          ? tf("required")
          : code === "TAKEN"
            ? t("codeTaken")
            : code === "PERCENT_OR_AMOUNT"
              ? t("percentOrAmount")
              : t("invalid")}
      </p>
    ));

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <input type="hidden" name="locale" value={locale} />
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div className="space-y-1.5">
        <Label htmlFor="code">{t("code")}</Label>
        <Input
          id="code"
          name="code"
          defaultValue={initial.code}
          placeholder="WELCOME10"
          required
          className="uppercase"
        />
        {err("code")}
      </div>

      <fieldset className="space-y-3 rounded-lg border p-4">
        <legend className="px-1 text-sm font-medium">{t("value")}</legend>
        <p className="text-xs text-muted-foreground">{t("valueHelp")}</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="percentOff">{t("percentOff")}</Label>
            <Input
              id="percentOff"
              name="percentOff"
              type="number"
              min={0}
              max={100}
              defaultValue={initial.percentOff}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amountOffGel">{t("amountOffGel")}</Label>
            <Input
              id="amountOffGel"
              name="amountOffGel"
              type="number"
              min={0}
              defaultValue={initial.amountOffGel}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amountOffUsd">{t("amountOffUsd")}</Label>
            <Input
              id="amountOffUsd"
              name="amountOffUsd"
              type="number"
              min={0}
              defaultValue={initial.amountOffUsd}
            />
          </div>
        </div>
        {err("percentOff")}
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="minSubtotalGel">{t("minSubtotalGel")}</Label>
          <Input
            id="minSubtotalGel"
            name="minSubtotalGel"
            type="number"
            min={0}
            defaultValue={initial.minSubtotalGel}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="minSubtotalUsd">{t("minSubtotalUsd")}</Label>
          <Input
            id="minSubtotalUsd"
            name="minSubtotalUsd"
            type="number"
            min={0}
            defaultValue={initial.minSubtotalUsd}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="startsAt">{t("startsAt")}</Label>
          <Input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            defaultValue={initial.startsAt}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expiresAt">{t("expiresAt")}</Label>
          <Input
            id="expiresAt"
            name="expiresAt"
            type="datetime-local"
            defaultValue={initial.expiresAt}
          />
          {err("expiresAt")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="maxRedemptions">{t("maxRedemptions")}</Label>
          <Input
            id="maxRedemptions"
            name="maxRedemptions"
            type="number"
            min={0}
            defaultValue={initial.maxRedemptions}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initial.isActive}
          className="size-4"
        />
        {t("isActive")}
      </label>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? tf("saving") : tf("save")}
        </Button>
        <Link
          href="/admin/discounts"
          className={buttonVariants({ variant: "ghost" })}
        >
          {tf("cancel")}
        </Link>
      </div>
    </form>
  );
}
