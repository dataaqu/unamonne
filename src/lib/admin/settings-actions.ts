"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { SETTING_KEYS } from "@/lib/settings";
import { localePath } from "@/i18n/navigation";

import { requireAdmin, type AdminFormState } from "./form";

/**
 * Save the editorial images. Every known key is written on each save — a key
 * the admin cleared has to become null, which an "only write what was posted"
 * loop would silently skip.
 */
export async function saveSettings(
  _prev: AdminFormState | undefined,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const locale = String(formData.get("locale") ?? "ka");

  try {
    for (const key of SETTING_KEYS) {
      const value = String(formData.get(key) ?? "").trim();

      await db
        .insert(siteSettings)
        .values({ key, value: value || null })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value: value || null, updatedAt: new Date() },
        });
    }
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }

  // The campaign shot is on the homepage and the catalogue head, both rendered
  // under the locale layout — revalidate broadly rather than guess.
  revalidatePath(localePath(locale, "/"), "layout");
  return { ok: true };
}
