"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { discountCodes } from "@/lib/db/schema";

import { discountFormSchema, extractDiscountForm } from "./discount-schema";
import { requireAdmin, type AdminFormState } from "./form";

function afterWrite(locale: string): never {
  revalidatePath(`/${locale}/admin/discounts`);
  redirect(`/${locale}/admin/discounts`);
}

export async function createDiscount(
  _prev: AdminFormState | undefined,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const parsed = discountFormSchema.safeParse(extractDiscountForm(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const locale = String(formData.get("locale") ?? "ka");

  try {
    await db.insert(discountCodes).values(parsed.data);
  } catch {
    // The only realistic failure is the unique code.
    return { ok: false, fieldErrors: { code: ["TAKEN"] } };
  }

  afterWrite(locale);
}

export async function updateDiscount(
  _prev: AdminFormState | undefined,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "UNKNOWN" };

  const parsed = discountFormSchema.safeParse(extractDiscountForm(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const locale = String(formData.get("locale") ?? "ka");

  try {
    // `redemptions` is deliberately not settable from the form: it is a record
    // of what happened, not a configuration value.
    await db
      .update(discountCodes)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(discountCodes.id, id));
  } catch {
    return { ok: false, fieldErrors: { code: ["TAKEN"] } };
  }

  afterWrite(locale);
}

export async function deleteDiscount(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "ka");
  if (id) await db.delete(discountCodes).where(eq(discountCodes.id, id));
  revalidatePath(`/${locale}/admin/discounts`);
}
