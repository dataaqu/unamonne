import { describe, it, expect } from "vitest";

import {
  CURRENCY,
  isRegion,
  regionFromCountry,
} from "@/lib/region";

describe("region detection", () => {
  it("maps Georgia to the GE region, everything else to INTL", () => {
    expect(regionFromCountry("GE")).toBe("GE");
    expect(regionFromCountry("ge")).toBe("GE");
    expect(regionFromCountry("US")).toBe("INTL");
    expect(regionFromCountry("DE")).toBe("INTL");
    expect(regionFromCountry(null)).toBe("INTL");
    expect(regionFromCountry(undefined)).toBe("INTL");
  });

  it("guards region values", () => {
    expect(isRegion("GE")).toBe(true);
    expect(isRegion("INTL")).toBe(true);
    expect(isRegion("XX")).toBe(false);
    expect(isRegion(undefined)).toBe(false);
  });

  it("maps regions to the correct currency", () => {
    expect(CURRENCY.GE).toEqual({ code: "GEL", symbol: "₾" });
    expect(CURRENCY.INTL).toEqual({ code: "USD", symbol: "$" });
  });
});
