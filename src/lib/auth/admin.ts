import { routing } from "@/i18n/routing";

/**
 * Path helpers for the admin gate. Kept pure (no request/session access) so the
 * proxy and unit tests can share them.
 */
export function isAdminPathname(pathname: string): boolean {
  return routing.locales.some(
    (locale) =>
      pathname === `/${locale}/admin` ||
      pathname.startsWith(`/${locale}/admin/`),
  );
}

export function localeFromPathname(pathname: string): string {
  const segment = pathname.split("/")[1];
  return (routing.locales as readonly string[]).includes(segment)
    ? segment
    : routing.defaultLocale;
}
