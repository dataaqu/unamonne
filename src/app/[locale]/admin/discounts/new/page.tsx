import { getTranslations } from "next-intl/server";

import { createDiscount } from "@/lib/admin/discount-actions";

import { DiscountForm } from "../discount-form";

export default async function NewDiscountPage() {
  const t = await getTranslations("Admin.discount");

  return (
    <main className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("newCode")}</h1>
      <DiscountForm action={createDiscount} />
    </main>
  );
}
