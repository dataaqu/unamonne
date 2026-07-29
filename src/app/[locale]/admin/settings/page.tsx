import { getTranslations } from "next-intl/server";

import { getSettings } from "@/lib/settings";

import { SettingsForm } from "./settings-form";

export default async function AdminSettingsPage() {
  const [t, settings] = await Promise.all([
    getTranslations("Admin.settings"),
    getSettings(),
  ]);

  return (
    <main className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p>
      </div>
      <SettingsForm initial={settings} />
    </main>
  );
}
