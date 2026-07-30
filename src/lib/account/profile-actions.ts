"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

import { requireUserId, type AccountFormState } from "./form";
import { extractProfileForm, profileFormSchema } from "./profile-schema";

/**
 * Save the signed-in user's own name and phone. Scoped to `requireUserId()` —
 * the id never comes from the form, so this can only ever write the caller's
 * own row.
 */
export async function updateProfileAction(
  _prev: AccountFormState | undefined,
  formData: FormData,
): Promise<AccountFormState> {
  const userId = await requireUserId();

  const parsed = profileFormSchema.safeParse(extractProfileForm(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const locale = String(formData.get("locale") ?? "ka");

  await db
    .update(users)
    .set({
      name: parsed.data.name,
      phone: parsed.data.phone,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  revalidatePath(`/${locale}/account`);
  return { ok: true };
}
