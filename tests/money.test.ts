import { describe, it, expect } from "vitest";

import { formatMoney, priceForRegion } from "@/lib/money";

describe("priceForRegion", () => {
  const product = { priceGel: 2500, priceUsd: 999 };

  it("selects the region's price column", () => {
    expect(priceForRegion(product, "GE")).toBe(2500);
    expect(priceForRegion(product, "INTL")).toBe(999);
  });
});

describe("formatMoney", () => {
  it("formats minor units into localized currency", () => {
    const ge = formatMoney(2500, "GE", "ka");
    expect(ge).toMatch(/25[.,]00/);
    expect(ge).toMatch(/₾|GEL/);

    const intl = formatMoney(999, "INTL", "en");
    expect(intl).toMatch(/9[.,]99/);
    expect(intl).toMatch(/\$|USD/);
  });
});
