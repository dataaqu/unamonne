"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";

import { requireUserId, type AccountFormState } from "./form";
import {
  addressFormSchema,
  extractAddressForm,
  shouldDefaultOnCreate,
  type AddressFormValues,
} from "./address-schema";

function afterWrite(locale: string): never {
  revalidatePath(`/${locale}/account/addresses`);
  redirect(`/${locale}/account/addresses`);
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Clear the default flag on all of a user's addresses (used before setting one). */
function clearDefaults(tx: Tx, userId: string) {
  return tx
    .update(addresses)
    .set({ isDefault: false, updatedAt: new Date() })
    .where(eq(addresses.userId, userId));
}

function values(userId: string, d: AddressFormValues, isDefault: boolean) {
  return {
    userId,
    fullName: d.fullName,
    phone: d.phone,
    country: d.country,
    city: d.city,
    line1: d.line1,
    line2: d.line2,
    postalCode: d.postalCode,
    isDefault,
  };
}

export async function createAddress(
  _prev: AccountFormState | undefined,
  formData: FormData,
): Promise<AccountFormState> {
  const userId = await requireUserId();

  const parsed = addressFormSchema.safeParse(extractAddressForm(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const locale = String(formData.get("locale") ?? "ka");
  const requested = formData.get("isDefault") != null;

  await db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: addresses.id })
      .from(addresses)
      .where(eq(addresses.userId, userId));

    const makeDefault = shouldDefaultOnCreate(existing.length, requested);
    if (makeDefault) await clearDefaults(tx, userId);

    await tx.insert(addresses).values(values(userId, parsed.data, makeDefault));
  });

  afterWrite(locale);
}

export async function updateAddress(
  _prev: AccountFormState | undefined,
  formData: FormData,
): Promise<AccountFormState> {
  const userId = await requireUserId();

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "UNKNOWN" };

  const parsed = addressFormSchema.safeParse(extractAddressForm(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const locale = String(formData.get("locale") ?? "ka");
  const requested = formData.get("isDefault") != null;

  await db.transaction(async (tx) => {
    // Promotion to default clears the others; demotion is only allowed by
    // promoting a different address, so a user always keeps exactly one default.
    if (requested) await clearDefaults(tx, userId);

    await tx
      .update(addresses)
      .set({
        ...values(userId, parsed.data, requested),
        updatedAt: new Date(),
      })
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
  });

  afterWrite(locale);
}

export async function setDefaultAddress(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "ka");
  if (!id) return;

  await db.transaction(async (tx) => {
    await clearDefaults(tx, userId);
    await tx
      .update(addresses)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)));
  });

  revalidatePath(`/${locale}/account/addresses`);
}

export async function deleteAddress(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "ka");
  if (!id) return;

  await db.transaction(async (tx) => {
    const [removed] = await tx
      .delete(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
      .returning({ wasDefault: addresses.isDefault });

    // Deleting the default leaves the account with none — promote the most
    // recent survivor so there is always a default to preselect at checkout.
    if (removed?.wasDefault) {
      const [next] = await tx
        .select({ id: addresses.id })
        .from(addresses)
        .where(eq(addresses.userId, userId))
        .orderBy(desc(addresses.createdAt))
        .limit(1);

      if (next) {
        await tx
          .update(addresses)
          .set({ isDefault: true, updatedAt: new Date() })
          .where(eq(addresses.id, next.id));
      }
    }
  });

  revalidatePath(`/${locale}/account/addresses`);
}
