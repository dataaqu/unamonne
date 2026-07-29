import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { CategoryForm, type CategoryInitial } from "../../category-form";
import { updateCategory } from "@/lib/admin/category-actions";
import { db } from "@/lib/db";

function localeFields(
  translations: { locale: string; name: string; slug: string; description: string | null }[],
  locale: "ka" | "en",
) {
  const tr = translations.find((t) => t.locale === locale);
  return {
    name: tr?.name ?? "",
    slug: tr?.slug ?? "",
    description: tr?.description ?? "",
  };
}

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("Admin.form");

  const category = await db.query.categories.findFirst({
    where: (c, { eq }) => eq(c.id, id),
    with: { translations: true },
  });
  if (!category) notFound();

  const initial: CategoryInitial = {
    id: category.id,
    isVisible: category.isVisible,
    sortOrder: category.sortOrder,
    ka: localeFields(category.translations, "ka"),
    en: localeFields(category.translations, "en"),
  };

  return (
    <main className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("editCategory")}</h1>
      <CategoryForm action={updateCategory} initial={initial} />
    </main>
  );
}
