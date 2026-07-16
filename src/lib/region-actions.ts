"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { REGION_COOKIE, isRegion } from "@/lib/region";

/**
 * Persist an explicit region choice (GE/INTL) from the region switcher. Writing
 * the cookie + revalidating re-renders currency-dependent UI on the next paint.
 */
export async function setRegionAction(formData: FormData) {
  const region = formData.get("region");
  if (!isRegion(region)) return;

  const cookieStore = await cookies();
  cookieStore.set(REGION_COOKIE, region, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
}
