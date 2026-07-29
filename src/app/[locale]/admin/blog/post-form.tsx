"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { ImageUploader } from "@/app/[locale]/admin/products/image-uploader";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import type { AdminFormState } from "@/lib/admin/form";

import { SeoPanel } from "./seo-panel";

type LocaleFields = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  seoTitle: string;
  seoDescription: string;
  focusKeyword: string;
};

const EMPTY_FIELDS: LocaleFields = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  seoTitle: "",
  seoDescription: "",
  focusKeyword: "",
};

export type PostInitial = {
  id?: string;
  status: "draft" | "published";
  isFeatured: boolean;
  coverUrls: string[];
  ka: LocaleFields;
  en: LocaleFields;
};

const EMPTY: PostInitial = {
  status: "draft",
  isFeatured: false,
  coverUrls: [],
  ka: EMPTY_FIELDS,
  en: EMPTY_FIELDS,
};

type Action = (
  prev: AdminFormState | undefined,
  formData: FormData,
) => Promise<AdminFormState>;

const LOCALES = ["ka", "en"] as const;

export function PostForm({
  action,
  initial = EMPTY,
}: {
  action: Action;
  initial?: PostInitial;
}) {
  const t = useTranslations("Admin.blog");
  const tf = useTranslations("Admin.form");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(action, { ok: false });

  const [fields, setFields] = useState<Record<"ka" | "en", LocaleFields>>({
    ka: initial.ka,
    en: initial.en,
  });

  const set = (loc: "ka" | "en", key: keyof LocaleFields, value: string) =>
    setFields((prev) => ({ ...prev, [loc]: { ...prev[loc], [key]: value } }));

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const err = (field: string) =>
    state.fieldErrors?.[field]?.map((code) => (
      <p key={code} className="text-sm text-destructive">
        {code === "REQUIRED" ? tf("required") : code}
      </p>
    ));

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="locale" value={locale} />
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          {t("status")}
          <select
            name="status"
            defaultValue={initial.status}
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="draft">{t("draft")}</option>
            <option value="published">{t("published")}</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={initial.isFeatured}
            className="size-4"
          />
          {tf("featured")}
        </label>
      </div>

      <div className="space-y-2">
        <Label>{t("cover")}</Label>
        <ImageUploader initialUrls={initial.coverUrls} />
      </div>

      {LOCALES.map((loc) => {
        const f = fields[loc];
        return (
          <fieldset key={loc} className="space-y-4 rounded-lg border p-4">
            <legend className="px-1 text-sm font-medium">
              {tf(loc === "ka" ? "sectionKa" : "sectionEn")}
            </legend>

            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor={`title${cap(loc)}`}>{t("titleField")}</Label>
                  <Input
                    id={`title${cap(loc)}`}
                    name={`title${cap(loc)}`}
                    value={f.title}
                    onChange={(e) => set(loc, "title", e.target.value)}
                    required
                  />
                  {err(`title${cap(loc)}`)}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`slug${cap(loc)}`}>{tf("slug")}</Label>
                  <Input
                    id={`slug${cap(loc)}`}
                    name={`slug${cap(loc)}`}
                    value={f.slug}
                    onChange={(e) => set(loc, "slug", e.target.value)}
                    placeholder={tf("slugHint")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`excerpt${cap(loc)}`}>{t("excerpt")}</Label>
                  <Input
                    id={`excerpt${cap(loc)}`}
                    name={`excerpt${cap(loc)}`}
                    value={f.excerpt}
                    onChange={(e) => set(loc, "excerpt", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`body${cap(loc)}`}>{t("body")}</Label>
                  <textarea
                    id={`body${cap(loc)}`}
                    name={`body${cap(loc)}`}
                    value={f.body}
                    onChange={(e) => set(loc, "body", e.target.value)}
                    rows={10}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    required
                  />
                  {err(`body${cap(loc)}`)}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`focusKeyword${cap(loc)}`}>
                    {t("focusKeyword")}
                  </Label>
                  <Input
                    id={`focusKeyword${cap(loc)}`}
                    name={`focusKeyword${cap(loc)}`}
                    value={f.focusKeyword}
                    onChange={(e) => set(loc, "focusKeyword", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`seoTitle${cap(loc)}`}>{t("seoTitle")}</Label>
                  <Input
                    id={`seoTitle${cap(loc)}`}
                    name={`seoTitle${cap(loc)}`}
                    value={f.seoTitle}
                    onChange={(e) => set(loc, "seoTitle", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`seoDescription${cap(loc)}`}>
                    {t("seoDescription")}
                  </Label>
                  <Input
                    id={`seoDescription${cap(loc)}`}
                    name={`seoDescription${cap(loc)}`}
                    value={f.seoDescription}
                    onChange={(e) => set(loc, "seoDescription", e.target.value)}
                  />
                </div>
              </div>

              <SeoPanel
                input={{
                  title: f.title,
                  slug: f.slug,
                  body: f.body,
                  seoTitle: f.seoTitle || null,
                  seoDescription: f.seoDescription || null,
                  ogImage: initial.coverUrls[0] ?? null,
                  focusKeyword: f.focusKeyword,
                }}
              />
            </div>
          </fieldset>
        );
      })}

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {tf("required")}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? tf("saving") : tf("save")}
        </Button>
        <Link href="/admin/blog" className={buttonVariants({ variant: "ghost" })}>
          {tf("cancel")}
        </Link>
      </div>
    </form>
  );
}
