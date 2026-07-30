import { describe, it, expect } from "vitest";

import {
  bareLocalePath,
  negotiateLocale,
} from "@/lib/locale-route";
import {
  homeUrl,
  localizedAlternates,
  localizedUrl,
} from "@/lib/seo/metadata";

describe("the prefix-free home page", () => {
  it("recognises the old locale-only addresses", () => {
    expect(bareLocalePath("/ka")).toBe("ka");
    expect(bareLocalePath("/en")).toBe("en");
    expect(bareLocalePath("/en/")).toBe("en");
  });

  it("leaves every other path to next-intl", () => {
    expect(bareLocalePath("/")).toBeNull();
    expect(bareLocalePath("/en/shop")).toBeNull();
    expect(bareLocalePath("/english")).toBeNull();
  });

  it("prefers the visitor's own choice over their browser's", () => {
    expect(negotiateLocale("en", "ka-GE,ka;q=0.9")).toBe("en");
    expect(negotiateLocale("ka", "en-US")).toBe("ka");
  });

  it("falls back to the browser, then to the house language", () => {
    expect(negotiateLocale(undefined, "en-GB,en;q=0.9")).toBe("en");
    expect(negotiateLocale(undefined, "fr-FR,fr;q=0.9,en;q=0.5")).toBe("en");
    expect(negotiateLocale(undefined, "fr-FR")).toBe("ka");
    expect(negotiateLocale(undefined, null)).toBe("ka");
    expect(negotiateLocale("de", null)).toBe("ka");
  });

  it("reads quality values rather than document order", () => {
    expect(negotiateLocale(undefined, "en;q=0.4,ka;q=0.8")).toBe("ka");
  });

  it("addresses the home page without a locale, and nothing else", () => {
    expect(localizedUrl("en", "")).toMatch(/\/$/);
    expect(localizedUrl("en", "")).not.toMatch(/\/en\/?$/);
    expect(localizedUrl("en", "/shop")).toMatch(/\/en\/shop$/);
  });

  it("gives the home page a canonical but no hreflang pair", () => {
    const shop = localizedAlternates("en", "/shop");
    expect(Object.keys(shop.languages)).toEqual(
      expect.arrayContaining(["ka", "en", "x-default"]),
    );
    expect(homeUrl()).toMatch(/\/$/);
    expect(homeUrl()).not.toMatch(/\/(ka|en)\/?$/);
  });
});
