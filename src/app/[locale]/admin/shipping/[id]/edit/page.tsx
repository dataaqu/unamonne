import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { updateZone } from "@/lib/admin/shipping-actions";
import { formatCountries } from "@/lib/admin/shipping-schema";
import { db } from "@/lib/db";
import { shippingZones } from "@/lib/db/schema";

import { ZoneForm } from "../../zone-form";

/** Blank (not "0") when a currency has no rate — the form treats them differently. */
function amount(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

export default async function EditShippingZonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("Admin.shipping");

  const zone = await db.query.shippingZones.findFirst({
    where: eq(shippingZones.id, id),
    with: { rates: true },
  });
  if (!zone) notFound();

  const gel = zone.rates.find((rate) => rate.currency === "GEL");
  const usd = zone.rates.find((rate) => rate.currency === "USD");

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">{t("editZone")}</h1>
      <ZoneForm
        action={updateZone}
        initial={{
          id: zone.id,
          name: zone.name,
          countries: formatCountries(zone.countries),
          isGeorgia: zone.isGeorgia,
          isFallback: zone.isFallback,
          sortOrder: zone.sortOrder,
          rateGel: amount(gel?.rate),
          freeThresholdGel: amount(gel?.freeThreshold),
          rateUsd: amount(usd?.rate),
          freeThresholdUsd: amount(usd?.freeThreshold),
        }}
      />
    </main>
  );
}
