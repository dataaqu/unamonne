/**
 * JSON-LD builders (T5.6). Pure functions returning schema.org objects; a
 * <JsonLd> component serializes them into a script tag. Amounts are minor units
 * (tetri/cents) and formatted to major units with two decimals for Offer.price.
 */
const CONTEXT = "https://schema.org";

export function organizationJsonLd(opts: { name: string; url: string }) {
  return {
    "@context": CONTEXT,
    "@type": "Organization",
    name: opts.name,
    url: opts.url,
  };
}

export function articleJsonLd(opts: {
  title: string;
  description?: string | null;
  image?: string | null;
  datePublished?: string | null;
  url: string;
  authorName?: string | null;
}) {
  return {
    "@context": CONTEXT,
    "@type": "Article",
    headline: opts.title,
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.image ? { image: opts.image } : {}),
    ...(opts.datePublished ? { datePublished: opts.datePublished } : {}),
    author: { "@type": "Organization", name: opts.authorName ?? "Vintage" },
    mainEntityOfPage: opts.url,
    url: opts.url,
  };
}

export function productJsonLd(opts: {
  name: string;
  description?: string | null;
  image?: string | null;
  price: number;
  currency: "GEL" | "USD";
  inStock: boolean;
  url: string;
}) {
  return {
    "@context": CONTEXT,
    "@type": "Product",
    name: opts.name,
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.image ? { image: opts.image } : {}),
    offers: {
      "@type": "Offer",
      price: (opts.price / 100).toFixed(2),
      priceCurrency: opts.currency,
      availability: opts.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: opts.url,
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
