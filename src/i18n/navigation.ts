import { createNavigation } from "next-intl/navigation";

import { routing, type Locale } from "./routing";

/**
 * Locale-aware navigation APIs. Use these instead of the ones from
 * `next/navigation` / `next/link` so locale prefixes are handled automatically.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

/**
 * The address a route actually has in a given language: `/shop` in Georgian,
 * `/en/shop` in English. Server actions need this for `redirect`,
 * `revalidatePath` and the absolute links that go into emails — anywhere the
 * prefix has to be written out rather than inferred.
 */
export function localePath(
  locale: string,
  href: Parameters<typeof getPathname>[0]["href"],
): string {
  return getPathname({ href, locale: locale as Locale });
}
