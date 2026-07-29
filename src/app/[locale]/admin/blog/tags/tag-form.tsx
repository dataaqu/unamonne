"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveBlogTag } from "@/lib/admin/blog-tag-actions";
import type { AdminFormState } from "@/lib/admin/form";

/**
 * One row of the tag table, used both for the "new tag" row and for editing an
 * existing one — the only difference is whether an id is posted.
 */
export function TagForm({
  id,
  nameKa = "",
  nameEn = "",
  sortOrder = 0,
}: {
  id?: string;
  nameKa?: string;
  nameEn?: string;
  sortOrder?: number;
}) {
  const t = useTranslations("Admin.form");
  const tb = useTranslations("Admin.blog");
  const locale = useLocale();
  const [state, action, pending] = useActionState<
    AdminFormState | undefined,
    FormData
  >(saveBlogTag, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="locale" value={locale} />
      {id ? <input type="hidden" name="id" value={id} /> : null}

      <label className="space-y-1">
        <span className="text-xs text-muted-foreground">{t("sectionKa")}</span>
        <Input name="nameKa" defaultValue={nameKa} required />
      </label>
      <label className="space-y-1">
        <span className="text-xs text-muted-foreground">{t("sectionEn")}</span>
        <Input name="nameEn" defaultValue={nameEn} required />
      </label>
      <label className="space-y-1">
        <span className="text-xs text-muted-foreground">{t("sortOrder")}</span>
        <Input
          name="sortOrder"
          type="number"
          min={0}
          defaultValue={sortOrder}
          className="w-20"
        />
      </label>

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? t("saving") : t("save")}
      </Button>

      {state && !state.ok ? (
        <p className="w-full text-sm text-destructive">{tb("tagTaken")}</p>
      ) : null}
    </form>
  );
}
