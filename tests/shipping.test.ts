import { describe, it, expect } from "vitest";

import { parseCountries, formatCountries } from "@/lib/admin/shipping-schema";
import {
  currencyForRegion,
  normalizeCountry,
  quoteShipping,
  resolveZone,
  type ZoneWithRates,
} from "@/lib/shipping";

const georgia: ZoneWithRates = {
  id: "z-ge",
  name: "Georgia",
  countries: ["GE"],
  isGeorgia: true,
  isFallback: false,
  rates: [{ currency: "GEL", rate: 500, freeThreshold: 10000 }],
};

const europe: ZoneWithRates = {
  id: "z-eu",
  name: "Europe",
  countries: ["DE", "FR"],
  isGeorgia: false,
  isFallback: false,
  rates: [{ currency: "USD", rate: 1500, freeThreshold: null }],
};

const rest: ZoneWithRates = {
  id: "z-row",
  name: "Rest of world",
  countries: [],
  isGeorgia: false,
  isFallback: true,
  rates: [{ currency: "USD", rate: 3000, freeThreshold: 20000 }],
};

const zones = [georgia, europe, rest];

describe("resolveZone", () => {
  it("matches an explicitly listed country", () => {
    expect(resolveZone(zones, "DE")?.id).toBe("z-eu");
  });

  it("is case- and whitespace-insensitive about country codes", () => {
    expect(resolveZone(zones, " de ")?.id).toBe("z-eu");
  });

  it("falls back for a country no zone lists", () => {
    expect(resolveZone(zones, "JP")?.id).toBe("z-row");
  });

  it("returns null when nothing matches and no fallback exists", () => {
    expect(resolveZone([georgia, europe], "JP")).toBeNull();
  });
});

describe("quoteShipping", () => {
  it("prices a domestic order in GEL", () => {
    const quote = quoteShipping(zones, {
      country: "GE",
      region: "GE",
      subtotal: 5000,
    });
    expect(quote).toMatchObject({ cost: 500, currency: "GEL", isFree: false });
  });

  it("gives free shipping at the threshold, not just above it", () => {
    const quote = quoteShipping(zones, {
      country: "GE",
      region: "GE",
      subtotal: 10000,
    });
    expect(quote).toMatchObject({ cost: 0, isFree: true });
  });

  it("charges when a zone has no free threshold, however large the order", () => {
    const quote = quoteShipping(zones, {
      country: "DE",
      region: "INTL",
      subtotal: 999999,
    });
    expect(quote).toMatchObject({ cost: 1500, isFree: false });
  });

  it("returns null when the zone has no rate in the region's currency", () => {
    // Georgia is configured in GEL only; an INTL shopper cannot be quoted.
    expect(
      quoteShipping([georgia], { country: "GE", region: "INTL", subtotal: 5000 }),
    ).toBeNull();
  });

  it("returns null rather than free when shipping is unconfigured", () => {
    expect(
      quoteShipping([], { country: "GE", region: "GE", subtotal: 5000 }),
    ).toBeNull();
  });
});

describe("currencyForRegion", () => {
  it("maps the two regions onto their currencies", () => {
    expect(currencyForRegion("GE")).toBe("GEL");
    expect(currencyForRegion("INTL")).toBe("USD");
  });
});

describe("country parsing", () => {
  it("accepts commas, spaces, and newlines, and uppercases", () => {
    expect(parseCountries("ge, am\ntr  fr")).toEqual(["GE", "AM", "TR", "FR"]);
  });

  it("drops duplicates and anything that isn't a two-letter code", () => {
    expect(parseCountries("GE, GE, XYZ, 1, US")).toEqual(["GE", "US"]);
  });

  it("treats blank input as a catch-all (no countries)", () => {
    expect(parseCountries("   ")).toEqual([]);
  });

  it("round-trips through the form representation", () => {
    expect(parseCountries(formatCountries(["GE", "AM"]))).toEqual(["GE", "AM"]);
  });
});

describe("normalizeCountry", () => {
  it("uppercases and trims", () => {
    expect(normalizeCountry(" us ")).toBe("US");
  });
});
