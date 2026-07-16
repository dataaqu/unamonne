import { getTranslations } from "next-intl/server";

import { CategoryForm } from "../category-form";
import { createCategory } from "@/lib/admin/category-actions";

export default async function NewCategoryPage() {
  const t = await getTranslations("Admin.form");
  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">{t("newCategory")}</h1>
      <CategoryForm action={createCategory} />
    </main>
  );
}
