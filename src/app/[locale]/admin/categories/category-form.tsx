"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminFormState } from "@/lib/admin/form";

type LocaleFields = { name: string; slug: string; description: string };

export type CategoryInitial = {
  id?: string;
  isVisible: boolean;
  sortOrder: number;
  ka: LocaleFields;
  en: LocaleFields;
};

const EMPTY: CategoryInitial = {
  isVisible: true,
  sortOrder: 0,
  ka: { name: "", slug: "", description: "" },
  en: { name: "", slug: "", description: "" },
};

type Action = (
  prev: AdminFormState | undefined,
  formData: FormData,
) => Promise<AdminFormState>;

export function CategoryForm({
  action,
  initial = EMPTY,
}: {
  action: Action;
  initial?: CategoryInitial;
}) {
  const t = useTranslations("Admin.form");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(action, { ok: false });

  const err = (field: string) =>
    state.fieldErrors?.[field]?.map((code) => (
      <p key={code} className="text-sm text-destructive">
        {code === "REQUIRED" ? t("required") : code}
      </p>
    ));

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <input type="hidden" name="locale" value={locale} />
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      {(["ka", "en"] as const).map((loc) => (
        <fieldset key={loc} className="space-y-3 rounded-lg border p-4">
          <legend className="px-1 text-sm font-medium">
            {loc === "ka" ? t("sectionKa") : t("sectionEn")}
          </legend>
          <div className="space-y-1.5">
            <Label htmlFor={`name-${loc}`}>{t("name")}</Label>
            <Input
              id={`name-${loc}`}
              name={`name${loc === "ka" ? "Ka" : "En"}`}
              defaultValue={initial[loc].name}
              required
            />
            {err(`name${loc === "ka" ? "Ka" : "En"}`)}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`slug-${loc}`}>{t("slug")}</Label>
            <Input
              id={`slug-${loc}`}
              name={`slug${loc === "ka" ? "Ka" : "En"}`}
              defaultValue={initial[loc].slug}
              placeholder={t("slugHint")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`desc-${loc}`}>{t("description")}</Label>
            <textarea
              id={`desc-${loc}`}
              name={`description${loc === "ka" ? "Ka" : "En"}`}
              defaultValue={initial[loc].description}
              rows={3}
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </fieldset>
      ))}

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isVisible"
            defaultChecked={initial.isVisible}
            className="size-4"
          />
          {t("visible")}
        </label>
        <div className="flex items-center gap-2">
          <Label htmlFor="sortOrder">{t("sortOrder")}</Label>
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
          {pending ? t("saving") : t("save")}
        </Button>
        <Link
          href="/admin/categories"
          className={buttonVariants({ variant: "ghost" })}
        >
          {t("cancel")}
        </Link>
      </div>
    </form>
  );
}
