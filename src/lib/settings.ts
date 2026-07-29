import { inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";

/**
 * The editorial slots the storefront reads. Keeping them in one union means a
 * typo is a type error rather than a silently blank hero.
 */
export const SETTING_KEYS = [
  /** Full-bleed campaign photograph behind the homepage headline. */
  "homeCampaignImage",
  /** The portrait beside the workshop statement panel. */
  "homeWorkshopImage",
  /** The image beside the newsletter block. */
  "homeNewsletterImage",
  /** Wide shot behind the catalogue's page head. */
  "shopCampaignImage",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

export type Settings = Partial<Record<SettingKey, string>>;

/**
 * Read the editorial settings. Returns an empty object when the database is
 * unreachable — every caller treats a missing image as "render without it",
 * so the homepage still stands up during an outage.
 */
export async function getSettings(): Promise<Settings> {
  try {
    const rows = await db.query.siteSettings.findMany({
      where: inArray(siteSettings.key, [...SETTING_KEYS]),
    });

    const settings: Settings = {};
    for (const row of rows) {
      if (row.value) settings[row.key as SettingKey] = row.value;
    }
    return settings;
  } catch {
    return {};
  }
}
