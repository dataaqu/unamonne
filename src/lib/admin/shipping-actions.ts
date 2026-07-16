"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { shippingRates, shippingZones } from "@/lib/db/schema";

import { requireAdmin, type AdminFormState } from "./form";
import {
  extractZoneForm,
  parseCountries,
  zoneFormSchema,
  type ZoneFormValues,
} from "./shipping-schema";

function afterWrite(locale: string): never {
  revalidatePath(`/${locale}/admin/shipping`);
  redirect(`/${locale}/admin/shipping`);
}

type RateInput = { currency: "GEL" | "USD"; rate: number | ""; free: number | "" };

function rateInputs(d: ZoneFormValues): RateInput[] {
  return [
    { currency: "GEL", rate: d.rateGel, free: d.freeThresholdGel },
    { currency: "USD", rate: d.rateUsd, free: d.freeThresholdUsd },
  ];
}

/**
 * Replace a zone's rates with what the form holds. A blank rate removes that
 * currency's row, so clearing the field really does make the zone unshippable
 * for that region rather than leaving a stale price behind.
 */
async function writeRates(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  zoneId: string,
  d: ZoneFormValues,
) {
  for (const { currency, rate, free } of rateInputs(d)) {
    const where = and(
      eq(shippingRates.zoneId, zoneId),
      eq(shippingRates.currency, currency),
    );

    if (rate === "") {
      await tx.delete(shippingRates).where(where);
      continue;
    }

    await tx
      .insert(shippingRates)
      .values({
        zoneId,
        currency,
        rate,
        freeThreshold: free === "" ? null : free,
      })
      .onConflictDoUpdate({
        target: [shippingRates.zoneId, shippingRates.currency],
        set: {
          rate,
          freeThreshold: free === "" ? null : free,
          updatedAt: new Date(),
        },
      });
  }
}

/**
 * Only one zone can be the fallback: promoting one demotes the rest, so a
 * destination never resolves to two different prices.
 */
async function enforceSingleFallback(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  keepId: string,
) {
  await tx
    .update(shippingZones)
    .set({ isFallback: false, updatedAt: new Date() })
    .where(eq(shippingZones.isFallback, true));

  await tx
    .update(shippingZones)
    .set({ isFallback: true, updatedAt: new Date() })
    .where(eq(shippingZones.id, keepId));
}

export async function createZone(
  _prev: AdminFormState | undefined,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const parsed = zoneFormSchema.safeParse(extractZoneForm(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  const locale = String(formData.get("locale") ?? "ka");
  const isGeorgia = formData.get("isGeorgia") != null;
  const isFallback = formData.get("isFallback") != null;

  await db.transaction(async (tx) => {
    const [zone] = await tx
      .insert(shippingZones)
      .values({
        name: d.name,
        countries: parseCountries(d.countries),
        isGeorgia,
        isFallback: false,
        sortOrder: d.sortOrder,
      })
      .returning();

    await writeRates(tx, zone.id, d);
    if (isFallback) await enforceSingleFallback(tx, zone.id);
  });

  afterWrite(locale);
}

export async function updateZone(
  _prev: AdminFormState | undefined,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "UNKNOWN" };

  const parsed = zoneFormSchema.safeParse(extractZoneForm(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  const locale = String(formData.get("locale") ?? "ka");
  const isGeorgia = formData.get("isGeorgia") != null;
  const isFallback = formData.get("isFallback") != null;

  await db.transaction(async (tx) => {
    await tx
      .update(shippingZones)
      .set({
        name: d.name,
        countries: parseCountries(d.countries),
        isGeorgia,
        sortOrder: d.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(shippingZones.id, id));

    await writeRates(tx, id, d);

    if (isFallback) {
      await enforceSingleFallback(tx, id);
    } else {
      await tx
        .update(shippingZones)
        .set({ isFallback: false, updatedAt: new Date() })
        .where(eq(shippingZones.id, id));
    }
  });

  afterWrite(locale);
}

export async function deleteZone(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "ka");
  if (id) {
    // Rates cascade with the zone.
    await db.delete(shippingZones).where(eq(shippingZones.id, id));
  }
  revalidatePath(`/${locale}/admin/shipping`);
}
