"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { ImageUploader } from "./image-uploader";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminFormState } from "@/lib/admin/form";

type LocaleFields = { name: string; slug: string; description: string };

export type ProductInitial = {
  id?: string;
  priceGel: number;
  priceUsd: number;
  stock: number;
  sortOrder: number;
  categoryId: string;
  isFeatured: boolean;
  isHidden: boolean;
  isOutOfStock: boolean;
  imageUrls: string[];
  ka: LocaleFields;
  en: LocaleFields;
};

const EMPTY: ProductInitial = {
  priceGel: 0,
  priceUsd: 0,
  stock: 0,
  sortOrder: 0,
  categoryId: "",
  isFeatured: false,
  isHidden: false,
  isOutOfStock: false,
  imageUrls: [],
  ka: { name: "", slug: "", description: "" },
  en: { name: "", slug: "", description: "" },
};

type Action = (
  prev: AdminFormState | undefined,
  formData: FormData,
) => Promise<AdminFormState>;

export function ProductForm({
  action,
  categories,
  initial = EMPTY,
}: {
  action: Action;
  categories: { id: string; name: string }[];
  initial?: ProductInitial;
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

      {(["ka", "en"] as const).map((loc) => {
        const suffix = loc === "ka" ? "Ka" : "En";
        return (
          <fieldset key={loc} className="space-y-3 rounded-lg border p-4">
            <legend className="px-1 text-sm font-medium">
              {loc === "ka" ? t("sectionKa") : t("sectionEn")}
            </legend>
            <div className="space-y-1.5">
              <Label htmlFor={`name-${loc}`}>{t("name")}</Label>
              <Input
                id={`name-${loc}`}
                name={`name${suffix}`}
                defaultValue={initial[loc].name}
                required
              />
              {err(`name${suffix}`)}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`slug-${loc}`}>{t("slug")}</Label>
              <Input
                id={`slug-${loc}`}
                name={`slug${suffix}`}
                defaultValue={initial[loc].slug}
                placeholder={t("slugHint")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`desc-${loc}`}>{t("description")}</Label>
              <textarea
                id={`desc-${loc}`}
                name={`description${suffix}`}
                defaultValue={initial[loc].description}
                rows={3}
                className="w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </fieldset>
        );
      })}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="priceGel">{t("priceGel")}</Label>
          <Input
            id="priceGel"
            name="priceGel"
            type="number"
            min={0}
            defaultValue={initial.priceGel}
          />
          {err("priceGel")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="priceUsd">{t("priceUsd")}</Label>
          <Input
            id="priceUsd"
            name="priceUsd"
            type="number"
            min={0}
            defaultValue={initial.priceUsd}
          />
          {err("priceUsd")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stock">{t("stock")}</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min={0}
            defaultValue={initial.stock}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sortOrder">{t("sortOrder")}</Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={initial.sortOrder}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="categoryId">{t("category")}</Label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={initial.categoryId}
          className="h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">—</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label>{t("images")}</Label>
        <ImageUploader initialUrls={initial.imageUrls} />
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={initial.isFeatured}
            className="size-4"
          />
          {t("featured")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isHidden"
            defaultChecked={initial.isHidden}
            className="size-4"
          />
          {t("hidden")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isOutOfStock"
            defaultChecked={initial.isOutOfStock}
            className="size-4"
          />
          {t("outOfStock")}
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? t("saving") : t("save")}
        </Button>
        <Link
          href="/admin/products"
          className={buttonVariants({ variant: "ghost" })}
        >
          {t("cancel")}
        </Link>
      </div>
    </form>
  );
}
