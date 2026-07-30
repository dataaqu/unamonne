import { getLocale, getTranslations } from "next-intl/server";

import { BrandMark } from "@/components/layout/brand-mark";
import { InstagramIcon } from "@/components/ui/icons";
import { Link } from "@/i18n/navigation";
import { BRAND } from "@/lib/brand";
import { pickTranslation } from "@/lib/catalog";
import { getVisibleCategories } from "@/lib/shop";

export type FooterVariant = "full" | "slim";

async function loadCategories(locale: string) {
  try {
    const categories = await getVisibleCategories();
    return categories
      .map((category) => pickTranslation(category.translations, locale))
      .filter((tr) => tr !== undefined)
      .slice(0, 5);
  } catch {
    return [];
  }
}

/**
 * The cocoa footer. `slim` is the one-line version used under checkout and the
 * journal; `full` carries the studio line, the shop columns and the house links.
 *
 * The "Shop" column is the live category list rather than a hardcoded one, so
 * it can never advertise a collection the catalog no longer has.
 */
export async function SiteFooter({
  variant = "full",
}: {
  variant?: FooterVariant;
}) {
  const [t, locale] = await Promise.all([
    getTranslations("Footer"),
    getLocale(),
  ]);

  // Read at render, not written into the source, so the notice ages with the
  // shop rather than with the commit that last touched this file.
  const year = new Date().getFullYear();
  const notice = `© ${year} ${BRAND.legalName} · ${BRAND.city} · ${t("rights")}`;

  if (variant === "slim") {
    return (
      <footer className="mt-auto bg-ink-900 px-6 py-10 text-ink-300 lg:px-10">
        <div className="mx-auto w-full max-w-[1600px] text-center text-xs">
          {notice}
        </div>
      </footer>
    );
  }

  const categories = await loadCategories(locale);

  return (
    <footer className="mt-auto bg-ink-900 px-6 py-14 text-ink-300 lg:px-10">
      <div className="mx-auto grid w-full max-w-[1600px] gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <BrandMark size="lg" tone="light" />
          <p className="mt-5 max-w-xs text-[13px] leading-relaxed">
            {t("studio")}
          </p>
          <a
            href={BRAND.instagram}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Instagram"
            className="mt-6 inline-flex text-ink-300 transition-colors hover:text-ink-50"
          >
            <InstagramIcon />
          </a>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
            {t("shop")}
          </div>
          <ul className="mt-4 space-y-2.5 text-[13px]">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/category/${category.slug}`}
                  className="transition-colors hover:text-ink-50"
                >
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/shop"
                className="transition-colors hover:text-ink-50"
              >
                {t("allProducts")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
            {t("house")}
          </div>
          <ul className="mt-4 space-y-2.5 text-[13px]">
            <li>
              <Link
                href="/blog"
                className="transition-colors hover:text-ink-50"
              >
                {t("journal")}
              </Link>
            </li>
            <li>
              <Link
                href="/account/saved"
                className="transition-colors hover:text-ink-50"
              >
                {t("saved")}
              </Link>
            </li>
            <li>
              <Link
                href="/account/orders"
                className="transition-colors hover:text-ink-50"
              >
                {t("orders")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
            {t("help")}
          </div>
          <ul className="mt-4 space-y-2.5 text-[13px]">
            <li>
              <Link
                href="/account"
                className="transition-colors hover:text-ink-50"
              >
                {t("account")}
              </Link>
            </li>
            <li>
              <Link
                href="/cart"
                className="transition-colors hover:text-ink-50"
              >
                {t("bag")}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-12 w-full max-w-[1600px] border-t border-ink-800 pt-6 text-center text-xs text-ink-500">
        {notice}
      </div>
    </footer>
  );
}
