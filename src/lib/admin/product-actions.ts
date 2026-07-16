"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { slugify } from "@/lib/catalog";
import { db } from "@/lib/db";
import {
  productImages,
  productTranslations,
  products,
} from "@/lib/db/schema";

import { extractProductForm, productFormSchema } from "./product-schema";
import { requireAdmin, type AdminFormState } from "./form";

function afterWrite(locale: string): never {
  revalidatePath(`/${locale}/admin/products`);
  redirect(`/${locale}/admin/products`);
}

function readFlags(formData: FormData) {
  return {
    isFeatured: formData.get("isFeatured") != null,
    isHidden: formData.get("isHidden") != null,
    isOutOfStock: formData.get("isOutOfStock") != null,
  };
}

function readImageUrls(formData: FormData): string[] {
  return formData
    .getAll("imageUrls")
    .map((v) => String(v).trim())
    .filter(Boolean);
}

export async function createProduct(
  _prev: AdminFormState | undefined,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const parsed = productFormSchema.safeParse(extractProductForm(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  const locale = String(formData.get("locale") ?? "ka");
  const flags = readFlags(formData);
  const imageUrls = readImageUrls(formData);

  await db.transaction(async (tx) => {
    const [product] = await tx
      .insert(products)
      .values({
        priceGel: d.priceGel,
        priceUsd: d.priceUsd,
        stock: d.stock,
        sortOrder: d.sortOrder,
        categoryId: d.categoryId || null,
        ...flags,
      })
      .returning();

    await tx.insert(productTranslations).values([
      {
        productId: product.id,
        locale: "ka",
        name: d.nameKa,
        slug: d.slugKa || slugify(d.nameKa),
        description: d.descriptionKa || null,
      },
      {
        productId: product.id,
        locale: "en",
        name: d.nameEn,
        slug: d.slugEn || slugify(d.nameEn),
        description: d.descriptionEn || null,
      },
    ]);

    if (imageUrls.length > 0) {
      await tx.insert(productImages).values(
        imageUrls.map((url, index) => ({
          productId: product.id,
          url,
          sortOrder: index,
        })),
      );
    }
  });

  afterWrite(locale);
}

export async function updateProduct(
  _prev: AdminFormState | undefined,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "UNKNOWN" };

  const parsed = productFormSchema.safeParse(extractProductForm(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  const locale = String(formData.get("locale") ?? "ka");
  const flags = readFlags(formData);
  const imageUrls = readImageUrls(formData);

  const translations = [
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
      .update(products)
      .set({
        priceGel: d.priceGel,
        priceUsd: d.priceUsd,
        stock: d.stock,
        sortOrder: d.sortOrder,
        categoryId: d.categoryId || null,
        ...flags,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    for (const tr of translations) {
      await tx
        .update(productTranslations)
        .set({ name: tr.name, slug: tr.slug, description: tr.description })
        .where(
          and(
            eq(productTranslations.productId, id),
            eq(productTranslations.locale, tr.loc),
          ),
        );
    }

    // Replace the image set (simple + predictable ordering).
    await tx.delete(productImages).where(eq(productImages.productId, id));
    if (imageUrls.length > 0) {
      await tx.insert(productImages).values(
        imageUrls.map((url, index) => ({
          productId: id,
          url,
          sortOrder: index,
        })),
      );
    }
  });

  afterWrite(locale);
}

export async function deleteProduct(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "ka");
  if (id) {
    await db.delete(products).where(eq(products.id, id));
  }
  revalidatePath(`/${locale}/admin/products`);
}
