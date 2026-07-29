import { count } from "drizzle-orm";
import { getTranslations } from "next-intl/server";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";

/**
 * Admin dashboard: signed-in identity + at-a-glance catalog counts.
 */
export default async function AdminDashboardPage() {
  const [session, t] = await Promise.all([auth(), getTranslations("Admin")]);

  const [productRows, categoryRows] = await Promise.all([
    db.select({ value: count() }).from(products),
    db.select({ value: count() }).from(categories),
  ]);

  const stats = [
    { label: t("stat.products"), value: productRows[0]?.value ?? 0 },
    { label: t("stat.categories"), value: categoryRows[0]?.value ?? 0 },
  ];

  return (
    <main className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("dashboard")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("signedInAs")} {session?.user?.email}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:max-w-md">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </main>
  );
}
