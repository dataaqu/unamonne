"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { slugify } from "@/lib/catalog";
import { db } from "@/lib/db";
import { categories, categoryTranslations } from "@/lib/db/schema";

import { categoryFormSchema, extractCategoryForm } from "./category-schema";
import { requireAdmin, type AdminFormState } from "./form";

function afterWrite(locale: string): never {
  revalidatePath(`/${locale}/admin/categories`);
  redirect(`/${locale}/admin/categories`);
}

export async function createCategory(
  _prev: AdminFormState | undefined,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const parsed = categoryFormSchema.safeParse(extractCategoryForm(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  const locale = String(formData.get("locale") ?? "ka");
  const isVisible = formData.get("isVisible") != null;

  await db.transaction(async (tx) => {
    const [category] = await tx
      .insert(categories)
      .values({ isVisible, sortOrder: d.sortOrder })
      .returning();

    await tx.insert(categoryTranslations).values([
      {
        categoryId: category.id,
        locale: "ka",
        name: d.nameKa,
        slug: d.slugKa || slugify(d.nameKa),
        description: d.descriptionKa || null,
      },
      {
        categoryId: category.id,
        locale: "en",
        name: d.nameEn,
        slug: d.slugEn || slugify(d.nameEn),
        description: d.descriptionEn || null,
      },
    ]);
  });

  afterWrite(locale);
}

export async function updateCategory(
  _prev: AdminFormState | undefined,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "UNKNOWN" };

  const parsed = categoryFormSchema.safeParse(extractCategoryForm(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  const locale = String(formData.get("locale") ?? "ka");
  const isVisible = formData.get("isVisible") != null;

  const rows = [
    {
      loc: "ka" as const,
      name: d.nameKa,
      slug: d.slugKa || slugify(d.nameKa),
      description: d.descriptionKa || null,
    },
    {
      loc: "en" as const,
      name: d.nameEn,
      slug: d.slugEn || slugify(d.nameEn),
      description: d.descriptionEn || null,
    },
  ];

  await db.transaction(async (tx) => {
    await tx
      .update(categories)
      .set({ isVisible, sortOrder: d.sortOrder, updatedAt: new Date() })
      .where(eq(categories.id, id));

    for (const row of rows) {
      await tx
        .update(categoryTranslations)
        .set({ name: row.name, slug: row.slug, description: row.description })
        .where(
          and(
            eq(categoryTranslations.categoryId, id),
            eq(categoryTranslations.locale, row.loc),
          ),
        );
    }
  });

  afterWrite(locale);
}

export async function deleteCategory(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "ka");
  if (id) {
    await db.delete(categories).where(eq(categories.id, id));
  }
  revalidatePath(`/${locale}/admin/categories`);
}
