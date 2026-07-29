import type { SortKey } from "@/lib/shop";

/** The catalog's URL contract. Every filter is a query parameter, so a filtered
 * view is a shareable link and the back button behaves. */
export type ShopParams = {
  q?: string;
  category?: string;
  max?: number;
  inStock: boolean;
  sort: SortKey;
  page: number;
};

const SORTS: SortKey[] = ["new", "low", "high"];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Parse `searchParams` into a filter set, discarding anything malformed rather
 * than erroring: a hand-edited URL should degrade to the unfiltered catalog,
 * not a 500.
 */
export function parseShopParams(
  searchParams: Record<string, string | string[] | undefined>,
): ShopParams {
  const rawMax = Number(first(searchParams.max));
  const rawPage = Number(first(searchParams.page));
  const sort = first(searchParams.sort);

  return {
    q: first(searchParams.q)?.trim() || undefined,
    category: first(searchParams.category) || undefined,
    max: Number.isFinite(rawMax) && rawMax > 0 ? Math.round(rawMax) : undefined,
    inStock: first(searchParams.inStock) === "1",
    sort: SORTS.includes(sort as SortKey) ? (sort as SortKey) : "new",
    page: Number.isFinite(rawPage) && rawPage > 1 ? Math.floor(rawPage) : 1,
  };
}

/**
 * Rebuild the URL with some parameters changed. Defaults are omitted so the
 * canonical unfiltered catalog stays a bare `/shop` — one URL, not a family of
 * equivalent ones with empty parameters.
 */
export function shopHref(
  base: string,
  params: ShopParams,
  overrides: Partial<ShopParams> = {},
): string {
  const next = { ...params, ...overrides };
  const search = new URLSearchParams();

  if (next.q) search.set("q", next.q);
  if (next.category) search.set("category", next.category);
  if (next.max !== undefined) search.set("max", String(next.max));
  if (next.inStock) search.set("inStock", "1");
  if (next.sort !== "new") search.set("sort", next.sort);
  // Changing any filter must reset paging, unless the caller asked for a page.
  if (overrides.page === undefined && next.page > 1 && !hasFilterChange(overrides)) {
    search.set("page", String(next.page));
  } else if (overrides.page !== undefined && overrides.page > 1) {
    search.set("page", String(overrides.page));
  }

  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

function hasFilterChange(overrides: Partial<ShopParams>): boolean {
  return (
    "q" in overrides ||
    "category" in overrides ||
    "max" in overrides ||
    "inStock" in overrides ||
    "sort" in overrides
  );
}
