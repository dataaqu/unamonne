import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { updateDiscount } from "@/lib/admin/discount-actions";
import { toDateTimeLocal } from "@/lib/admin/discount-schema";
import { db } from "@/lib/db";
import { discountCodes } from "@/lib/db/schema";

import { DiscountForm, type DiscountInitial } from "../../discount-form";

/** Nullable integer columns render as an empty input, not a literal "null". */
function text(value: number | null): string {
  return value === null ? "" : String(value);
}

export default async function EditDiscountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, t] = await Promise.all([
    params,
    getTranslations("Admin.discount"),
  ]);

  const code = await db.query.discountCodes.findFirst({
    where: eq(discountCodes.id, id),
  });
  if (!code) notFound();

  const initial: DiscountInitial = {
    id: code.id,
    code: code.code,
    percentOff: text(code.percentOff),
    amountOffGel: text(code.amountOffGel),
    amountOffUsd: text(code.amountOffUsd),
    minSubtotalGel: text(code.minSubtotalGel),
    minSubtotalUsd: text(code.minSubtotalUsd),
    maxRedemptions: text(code.maxRedemptions),
    startsAt: toDateTimeLocal(code.startsAt),
    expiresAt: toDateTimeLocal(code.expiresAt),
    isActive: code.isActive,
  };

  return (
    <main className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("editCode")}</h1>
      <DiscountForm action={updateDiscount} initial={initial} />
    </main>
  );
}
