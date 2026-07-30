import { getTranslations } from "next-intl/server";

import { QuickAdd } from "@/components/shop/quick-add";
import { SaveButton } from "@/components/shop/save-button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { isNewIn } from "@/lib/brand";
import { pickTranslation } from "@/lib/catalog";
import { formatPrice } from "@/lib/money";
import type { Region } from "@/lib/region";
import { isProductAvailable, type ShopProduct } from "@/lib/shop";
import { cn } from "@/lib/utils";

/**
 * The catalog card: image on sand, caps name, price right. A sold-out piece is
 * desaturated but never hidden — the house shows what it has made.
 */
export async function ProductCard({
  product,
  locale,
  region,
  saved = false,
  categoryName,
  imageClassName = "h-[280px] sm:h-[340px]",
}: {
  product: ShopProduct;
  locale: string;
  region: Region;
  saved?: boolean;
  categoryName?: string;
  imageClassName?: string;
}) {
  const t = await getTranslations("Shop");

  const tr = pickTranslation(product.translations, locale);
  const image = [...product.images].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  )[0];
  const price = region === "GE" ? product.priceGel : product.priceUsd;
  const available = isProductAvailable(product);
  const hasVariants = product.variants.length > 0;
  const href = `/product/${tr?.slug ?? ""}`;

  const badge = product.editionSize
    ? {
        tone: "cream" as const,
        label: t("edition", { count: product.editionSize }),
      }
    : isNewIn(product.createdAt)
      ? { tone: "ink" as const, label: t("newIn") }
      : null;

  return (
    <article className="group">
      <div className="relative overflow-hidden bg-accent-100">
        <Link href={href} className="block">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.url}
              alt={image.alt ?? tr?.name ?? ""}
              className={cn(
                "w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]",
                imageClassName,
                available ? "" : "opacity-55 grayscale",
              )}
            />
          ) : (
            <div className={cn("w-full", imageClassName)} />
          )}
        </Link>

        {badge ? (
          <div className="pointer-events-none absolute left-0 top-0">
            <Badge tone={badge.tone}>{badge.label}</Badge>
          </div>
        ) : null}

        <SaveButton
          productId={product.id}
          productName={tr?.name ?? ""}
          saved={saved}
          className="absolute right-3 top-3"
        />

        {available ? (
          hasVariants ? (
            // A size is a decision, not a hover: send them to the piece.
            <Link
              href={href}
              className="absolute inset-x-0 bottom-0 flex h-11 translate-y-full items-center justify-center bg-ink-900 text-[11px] uppercase tracking-[0.18em] text-ink-50 transition-transform duration-300 focus-visible:translate-y-0 group-hover:translate-y-0"
            >
              {t("chooseSize")}
            </Link>
          ) : (
            <QuickAdd productId={product.id} />
          )
        ) : null}
      </div>

      <div className="mt-3.5 flex items-baseline justify-between gap-3">
        <Link
          href={href}
          className="group/name relative text-[11px] uppercase tracking-[0.16em] text-ink-900"
        >
          {tr?.name ?? "—"}
          <span
            aria-hidden
            className="absolute -bottom-0.5 left-0 block h-px w-full origin-left scale-x-0 bg-ink-900 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
          />
        </Link>
        {available ? (
          <span className="text-sm tabular-nums">
            {formatPrice(price, region)}
          </span>
        ) : (
          <span className="text-[11px] uppercase tracking-[0.16em] text-ink-400">
            {t("soldOut")}
          </span>
        )}
      </div>

      {categoryName ? (
        <div className="mt-1 text-xs text-ink-500">{categoryName}</div>
      ) : null}
    </article>
  );
}
