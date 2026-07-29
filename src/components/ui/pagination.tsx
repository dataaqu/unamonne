import { ArrowIcon } from "@/components/ui/icons";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Square page numbers plus a "next" affordance. Pages are links, so a crawler
 * can walk the whole catalog and a shopper can share page 3.
 */
export function Pagination({
  page,
  pageCount,
  hrefFor,
  nextLabel,
  className,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
  nextLabel: string;
  className?: string;
}) {
  if (pageCount <= 1) return null;

  // Keep the strip short on long catalogs: a window around the current page.
  const start = Math.max(1, Math.min(page - 1, pageCount - 3));
  const end = Math.min(pageCount, start + 3);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center gap-1", className)}
    >
      {pages.map((n) => (
        <Link
          key={n}
          href={hrefFor(n)}
          aria-current={n === page ? "page" : undefined}
          className={cn(
            "flex h-9 w-9 items-center justify-center text-[12px] tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900",
            n === page
              ? "bg-ink-900 text-ink-50"
              : "text-ink-600 hover:bg-ink-200/60 hover:text-ink-900",
          )}
        >
          {n}
        </Link>
      ))}
      {page < pageCount ? (
        <Link
          href={hrefFor(page + 1)}
          className="ml-2 flex h-9 items-center gap-2 px-3 text-[11px] uppercase tracking-[0.16em] text-ink-700 hover:text-ink-900"
        >
          {nextLabel}
          <ArrowIcon className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </nav>
  );
}
