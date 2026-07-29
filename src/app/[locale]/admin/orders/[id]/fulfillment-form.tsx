"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOrderFulfillment } from "@/lib/admin/order-actions";
import { FULFILLMENT_STATUSES } from "@/lib/admin/order-schema";

export function FulfillmentForm({
  id,
  current,
  tracking,
}: {
  id: string;
  current: string;
  tracking: string;
}) {
  const t = useTranslations("Admin.order");
  const locale = useLocale();
  const [state, action, pending] = useActionState(updateOrderFulfillment, {
    ok: false,
  });

  return (
    <form action={action} className="flex max-w-sm flex-col gap-4">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="locale" value={locale} />

      <div className="space-y-1.5">
        <Label htmlFor="fulfillmentStatus">{t("fulfillment")}</Label>
        <select
          id="fulfillmentStatus"
          name="fulfillmentStatus"
          defaultValue={current}
          className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
        >
          {FULFILLMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`fulfillmentStatus.${s}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="trackingNumber">{t("tracking")}</Label>
        <Input
          id="trackingNumber"
          name="trackingNumber"
          defaultValue={tracking}
          placeholder={t("trackingHint")}
        />
      </div>

      {state.ok ? (
        <p className="text-sm text-emerald-600" role="status">
          {t("saved")}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? t("saving") : t("save")}
      </Button>
    </form>
  );
}
