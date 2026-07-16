import { getTranslations } from "next-intl/server";

import { createZone } from "@/lib/admin/shipping-actions";

import { ZoneForm } from "../zone-form";

export default async function NewShippingZonePage() {
  const t = await getTranslations("Admin.shipping");

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">{t("newZone")}</h1>
      <ZoneForm action={createZone} />
    </main>
  );
}
