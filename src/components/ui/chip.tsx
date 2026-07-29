import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Pill filter chip, rendered as a real link so filtering is a navigation:
 * shareable, crawlable, and it works with the back button.
 */
export function Chip({
  href,
  active = false,
  className,
  children,
}: {
  href: string;
  active?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-8 items-center rounded-pill border px-4 text-[11px] uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2",
        active
          ? "border-ink-900 bg-ink-900 text-ink-50"
          : "border-ink-300 text-ink-600 hover:border-ink-900 hover:text-ink-900",
        className,
      )}
    >
      {children}
    </Link>
  );
}

/** Breadcrumb trail. Hairline slashes, last crumb is plain text. */
export function Breadcrumbs({
  items,
  tone = "dark",
  className,
}: {
  items: { label: string; href?: string }[];
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.14em]",
        tone === "dark" ? "text-ink-500" : "text-ink-200",
        className,
      )}
    >
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-2">
          {index > 0 ? (
            <span className={tone === "dark" ? "text-ink-300" : "text-ink-400"}>
              /
            </span>
          ) : null}
          {item.href ? (
            <Link
              href={item.href}
              className={
                tone === "dark" ? "hover:text-ink-900" : "hover:text-ink-50"
              }
            >
              {item.label}
            </Link>
          ) : (
            <span className={tone === "dark" ? "text-ink-900" : "text-ink-50"}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
