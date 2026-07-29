"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { ImageUploader } from "@/app/[locale]/admin/products/image-uploader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { AdminFormState } from "@/lib/admin/form";
import { saveSettings } from "@/lib/admin/settings-actions";
import { SETTING_KEYS, type Settings } from "@/lib/settings";

/**
 * The editorial images behind the storefront's full-bleed sections. Each one
 * reuses the product image uploader, so they land in the same Cloudflare bucket
 * with the same presigned flow.
 */
export function SettingsForm({ initial }: { initial: Settings }) {
  const t = useTranslations("Admin.settings");
  const tf = useTranslations("Admin.form");
  const locale = useLocale();
  const [state, action, pending] = useActionState<
    AdminFormState | undefined,
    FormData
  >(saveSettings, undefined);

  return (
    <form action={action} className="max-w-2xl space-y-8">
      <input type="hidden" name="locale" value={locale} />

      {SETTING_KEYS.map((key) => (
        <div key={key} className="space-y-2">
          <Label>{t(key)}</Label>
          <p className="text-xs text-muted-foreground">{t(`${key}Hint`)}</p>
          {/* The uploader posts under `imageUrls`; mirror its single value onto
              this setting's own name so one form can carry several images. */}
          <ImageUploader initialUrls={initial[key] ? [initial[key]!] : []} name={key} />
        </div>
      ))}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? tf("saving") : tf("save")}
        </Button>
        {state?.ok ? (
          <span className="text-sm text-success-700">{t("saved")}</span>
        ) : null}
      </div>
    </form>
  );
}
