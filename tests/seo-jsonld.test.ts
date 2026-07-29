import { describe, it, expect } from "vitest";

import { routing } from "@/i18n/routing";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  productJsonLd,
} from "@/lib/seo/jsonld";
import { localizedAlternates } from "@/lib/seo/metadata";

describe("productJsonLd", () => {
  it("formats minor units to major price and maps availability", () => {
    const ld = productJsonLd({
      name: "Oak chair",
      price: 2500,
      currency: "GEL",
      inStock: true,
      url: "https://shop.test/en/product/oak-chair",
    });
    expect(ld["@type"]).toBe("Product");
    expect(ld.offers.price).toBe("25.00");
    expect(ld.offers.priceCurrency).toBe("GEL");
    expect(ld.offers.availability).toBe("https://schema.org/InStock");
  });

  it("marks out-of-stock products", () => {
    const ld = productJsonLd({
      name: "x",
      price: 100,
      currency: "USD",
      inStock: false,
      url: "u",
    });
    expect(ld.offers.availability).toBe("https://schema.org/OutOfStock");
  });
});

describe("articleJsonLd", () => {
  it("sets the headline and omits empty optionals", () => {
    const ld = articleJsonLd({ title: "Hello", url: "u" });
    expect(ld.headline).toBe("Hello");
    expect("description" in ld).toBe(false);
  });
});

describe("breadcrumbJsonLd", () => {
  it("numbers items from 1", () => {
    const ld = breadcrumbJsonLd([
      { name: "Home", url: "/" },
      { name: "Blog", url: "/blog" },
    ]);
    expect(ld.itemListElement.map((i) => i.position)).toEqual([1, 2]);
  });
});

describe("localizedAlternates", () => {
  it("builds a canonical plus every locale and x-default", () => {
    const alt = localizedAlternates("en", "/blog/my-post");
    expect(alt.canonical).toMatch(/\/en\/blog\/my-post$/);
    expect(Object.keys(alt.languages).sort()).toEqual([
      "en",
      "ka",
      "x-default",
    ]);
    expect(alt.languages["x-default"]).toBe(
      alt.languages[routing.defaultLocale],
    );
  });
});
