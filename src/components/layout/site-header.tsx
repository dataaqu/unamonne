import { getTranslations } from "next-intl/server";

import { BrandMark } from "@/components/layout/brand-mark";
import { CurrencyToggle } from "@/components/layout/currency-toggle";
import { LocaleMenu } from "@/components/layout/locale-menu";
import { SearchBox } from "@/components/layout/search-box";
import { Bag } from "@/components/shop/bag";
import { ChevronIcon, LockIcon, UserIcon } from "@/components/ui/icons";
import { Link } from "@/i18n/navigation";
import { pickTranslation } from "@/lib/catalog";
import { getVisibleCategories } from "@/lib/shop";
import { cn } from "@/lib/utils";

export type HeaderVariant =
  /** Solid, sticky. The default across the shop. */
  | "solid"
  /** Transparent over a full-bleed campaign image. */
  | "transparent"
  /** Brand + one reassurance. Checkout and confirmation only. */
  | "slim";

export type HeaderSection = "shop" | "journal" | null;

/** Categories degrade to nothing if the database is unreachable. */
async function loadCategories(locale: string) {
  try {
    const categories = await getVisibleCategories();
    return categories
      .map((category) => pickTranslation(category.translations, locale))
      .filter((tr) => tr !== undefined);
  } catch {
    return [];
  }
}

/**
 * The house header.
 *
 * "Collections" is a real menu built from the visible categories rather than a
 * decorative nav item — it is a `<details>`, so it opens without JavaScript and
 * every entry is a crawlable link.
 */
export async function SiteHeader({
  variant = "solid",
  section = null,
  searchQuery,
  locale,
}: {
  variant?: HeaderVariant;
  section?: HeaderSection;
  searchQuery?: string;
  locale: string;
}) {
  const t = await getTranslations("Nav");

  if (variant === "slim") {
    return (
      <header className="border-b border-ink-200">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-6 py-5 lg:px-10">
          <BrandMark />
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-ink-500">
            <LockIcon className="h-4 w-4" />
            {t("secureCheckout")}
          </div>
        </div>
      </header>
    );
  }

  const light = variant === "transparent";
  const categories = await loadCategories(locale);

  const navLink = (active: boolean) =>
    cn(
      "border-b pb-0.5 transition-colors",
      light
        ? active
          ? "border-ink-50"
          : "border-transparent hover:border-ink-50"
        : active
          ? "border-ink-900 text-ink-900"
          : "border-transparent hover:border-ink-900 hover:text-ink-900",
    );

  return (
    <header
      className={cn(
        light
          ? "absolute inset-x-0 top-0 z-30 text-ink-50"
          : "sticky top-0 z-30 border-b border-ink-200 bg-ink-100/95 text-ink-900 backdrop-blur",
      )}
    >
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-6 px-6 py-5 lg:px-10">
        <nav
          className={cn(
            "hidden items-center gap-7 text-[11px] uppercase tracking-[0.18em] md:flex",
            light ? "text-ink-50" : "text-ink-700",
          )}
        >
          <Link href="/shop" className={navLink(section === "shop")}>
            {t("shop")}
          </Link>

          {categories.length > 0 ? (
            <details className="group relative">
              <summary
                className={cn(
                  "flex cursor-pointer list-none items-center gap-1.5 [&::-webkit-details-marker]:hidden",
                  navLink(false),
                )}
              >
                {t("collections")}
                <ChevronIcon className="h-3 w-3 transition-transform group-open:rotate-180" />
              </summary>
              <div className="absolute left-0 top-8 z-40 w-52 border border-ink-200 bg-ink-100 py-1 text-ink-900 shadow-pop">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/category/${category.slug}`}
                    className="block px-3.5 py-2 text-[12px] normal-case tracking-normal text-ink-600 hover:bg-ink-200/60 hover:text-ink-900"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </details>
          ) : null}

          <Link href="/blog" className={navLink(section === "journal")}>
            {t("journal")}
          </Link>
        </nav>

        {/* The name takes the header with it: white where the header inverts
            over the campaign image, cocoa on the cream bar. */}
        <BrandMark
          size={light ? "md" : "sm"}
          tone={light ? "light" : "dark"}
          animate
        />

        <div
          className={cn(
            "flex items-center gap-4",
            light ? "text-ink-50" : "text-ink-700",
          )}
        >
          <div className="hidden sm:block">
            <CurrencyToggle tone={light ? "light" : "dark"} />
          </div>
          <div className="hidden sm:block">
            <LocaleMenu tone={light ? "light" : "dark"} />
          </div>
          <SearchBox
            tone={light ? "light" : "dark"}
            initialQuery={searchQuery}
          />
          <Link
            href="/account"
            aria-label={t("account")}
            className={cn(
              "hidden sm:block",
              light ? "hover:opacity-75" : "hover:text-ink-900",
            )}
          >
            <UserIcon />
          </Link>
          <Bag tone={light ? "light" : "dark"} />
        </div>
      </div>
    </header>
  );
}
