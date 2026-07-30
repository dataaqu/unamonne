import { routing } from "@/i18n/routing";

/**
 * Path helpers for the admin gate. Kept pure (no request/session access) so the
 * proxy and unit tests can share them.
 *
 * Georgian is unprefixed, so the admin answers at both `/admin` and
 * `/en/admin` and the gate has to know both shapes.
 */
export function isAdminPathname(pathname: string): boolean {
  const rest = withoutLocale(pathname);
  return rest === "/admin" || rest.startsWith("/admin/");
}

export function localeFromPathname(pathname: string): string {
  const segment = pathname.split("/")[1];
  return (routing.locales as readonly string[]).includes(segment)
    ? segment
    : routing.defaultLocale;
}

/** `/en/admin` → `/admin`; `/admin` → `/admin`. */
function withoutLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1);
    }
  }
  return pathname;
}
