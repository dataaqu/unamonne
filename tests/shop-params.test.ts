import { describe, it, expect } from "vitest";

import { parseShopParams, shopHref } from "@/lib/shop-params";

describe("parseShopParams", () => {
  it("defaults to the unfiltered catalog", () => {
    expect(parseShopParams({})).toEqual({
      q: undefined,
      category: undefined,
      max: undefined,
      inStock: false,
      sort: "new",
      page: 1,
    });
  });

  it("reads every filter off the query string", () => {
    expect(
      parseShopParams({
        q: " signet ",
        category: "rings",
        max: "109000",
        inStock: "1",
        sort: "low",
        page: "3",
      }),
    ).toEqual({
      q: "signet",
      category: "rings",
      max: 109000,
      inStock: true,
      sort: "low",
      page: 3,
    });
  });

  it("discards nonsense rather than erroring", () => {
    const params = parseShopParams({
      max: "abc",
      page: "-4",
      sort: "sideways",
      q: "   ",
    });

    expect(params.max).toBeUndefined();
    expect(params.page).toBe(1);
    expect(params.sort).toBe("new");
    expect(params.q).toBeUndefined();
  });

  it("takes the first value when a parameter is repeated", () => {
    expect(parseShopParams({ category: ["rings", "earrings"] }).category).toBe(
      "rings",
    );
  });
});

describe("shopHref", () => {
  const base = parseShopParams({});

  it("keeps the canonical catalog as a bare path", () => {
    expect(shopHref("/shop", base)).toBe("/shop");
  });

  it("omits defaults so one view has one URL", () => {
    expect(shopHref("/shop", base, { sort: "new" })).toBe("/shop");
    expect(shopHref("/shop", base, { inStock: false })).toBe("/shop");
  });

  it("resets paging when a filter changes", () => {
    const onPageThree = parseShopParams({ page: "3", category: "rings" });
    expect(shopHref("/shop", onPageThree, { category: "earrings" })).toBe(
      "/shop?category=earrings",
    );
  });

  it("keeps the filters when only the page changes", () => {
    const filtered = parseShopParams({ category: "rings", sort: "high" });
    expect(shopHref("/shop", filtered, { page: 2 })).toBe(
      "/shop?category=rings&sort=high&page=2",
    );
  });

  it("clears a filter when it is overridden with undefined", () => {
    const filtered = parseShopParams({ category: "rings", max: "50000" });
    expect(shopHref("/shop", filtered, { category: undefined })).toBe(
      "/shop?max=50000",
    );
  });
});
