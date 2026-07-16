import { Link } from "@/i18n/navigation";
import { pickTranslation } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import type { Region } from "@/lib/region";

type CardProduct = {
  priceGel: number;
  priceUsd: number;
  translations: { locale: string; name: string; slug: string }[];
  images: { url: string; sortOrder: number }[];
};

export function ProductCard({
  product,
  locale,
  region,
}: {
  product: CardProduct;
  locale: string;
  region: Region;
}) {
  const tr = pickTranslation(product.translations, locale);
  const image = [...product.images].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  )[0];
  const price = region === "GE" ? product.priceGel : product.priceUsd;

  return (
    <Link href={`/product/${tr?.slug ?? ""}`} className="group block">
      <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={tr?.name ?? ""}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : null}
      </div>
      <div className="mt-2 space-y-0.5">
        <p className="text-sm font-medium">{tr?.name ?? "—"}</p>
        <p className="text-sm text-muted-foreground">
          {formatMoney(price, region, locale)}
        </p>
      </div>
    </Link>
  );
}
