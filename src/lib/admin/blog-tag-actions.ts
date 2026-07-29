"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { slugify } from "@/lib/catalog";
import { db } from "@/lib/db";
import { blogTagTranslations, blogTags } from "@/lib/db/schema";

import { requireAdmin, type AdminFormState } from "./form";

/**
 * Journal tags are small enough to manage from a single page: a name per locale
 * and an order. Slugs are derived from the names, and a slug collision is the
 * only realistic failure — reported rather than swallowed, because a duplicate
 * tag would give the journal two chips that filter the same thing.
 */
export async function saveBlogTag(
  _prev: AdminFormState | undefined,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const nameKa = String(formData.get("nameKa") ?? "").trim();
  const nameEn = String(formData.get("nameEn") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;
  const locale = String(formData.get("locale") ?? "ka");

  const fieldErrors: Record<string, string[]> = {};
  if (!nameKa) fieldErrors.nameKa = ["REQUIRED"];
  if (!nameEn) fieldErrors.nameEn = ["REQUIRED"];
  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };

  const rows = [
    { locale: "ka" as const, name: nameKa, slug: slugify(nameKa) },
    { locale: "en" as const, name: nameEn, slug: slugify(nameEn) },
  ];

  try {
    await db.transaction(async (tx) => {
      let tagId = id;

      if (tagId) {
        await tx
          .update(blogTags)
          .set({ sortOrder })
          .where(eq(blogTags.id, tagId));

        for (const row of rows) {
          await tx
            .update(blogTagTranslations)
            .set({ name: row.name, slug: row.slug })
            .where(
              and(
                eq(blogTagTranslations.tagId, tagId),
                eq(blogTagTranslations.locale, row.locale),
              ),
            );
        }
      } else {
        const [tag] = await tx
          .insert(blogTags)
          .values({ sortOrder })
          .returning({ id: blogTags.id });
        tagId = tag.id;

        await tx
          .insert(blogTagTranslations)
          .values(rows.map((row) => ({ tagId, ...row })));
      }
    });
  } catch {
    return { ok: false, fieldErrors: { nameKa: ["TAKEN"] } };
  }

  revalidatePath(`/${locale}/admin/blog/tags`);
  return { ok: true };
}

export async function deleteBlogTag(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "ka");
  if (id) await db.delete(blogTags).where(eq(blogTags.id, id));
  revalidatePath(`/${locale}/admin/blog/tags`);
}
