import { getTranslations } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { findOrderById } from "@/lib/orders";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const [sp, t] = await Promise.all([
    searchParams,
    getTranslations("Checkout"),
  ]);

  const order = sp.order ? await findOrderById(sp.order) : null;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("success.title")}
      </h1>
      <p className="text-muted-foreground">{t("success.body")}</p>
      {order ? (
        <p className="font-medium tabular-nums">
          {t("orderNumber", { id: order.id.slice(0, 8).toUpperCase() })}
        </p>
      ) : null}
      <Link href="/shop" className={buttonVariants()}>
        {t("continue")}
      </Link>
    </main>
  );
}
