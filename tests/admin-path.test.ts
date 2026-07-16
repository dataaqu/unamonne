import { describe, it, expect } from "vitest";

import { isAdminPathname, localeFromPathname } from "@/lib/auth/admin";

describe("admin path helpers", () => {
  it("matches locale-prefixed admin paths", () => {
    expect(isAdminPathname("/ka/admin")).toBe(true);
    expect(isAdminPathname("/en/admin")).toBe(true);
    expect(isAdminPathname("/ka/admin/products")).toBe(true);
    expect(isAdminPathname("/en/admin/orders/42")).toBe(true);
  });

  it("does not match non-admin or unprefixed paths", () => {
    expect(isAdminPathname("/ka")).toBe(false);
    expect(isAdminPathname("/en/login")).toBe(false);
    expect(isAdminPathname("/admin")).toBe(false);
    expect(isAdminPathname("/ka/administrator")).toBe(false);
  });

  it("extracts the locale, falling back to the default", () => {
    expect(localeFromPathname("/en/admin")).toBe("en");
    expect(localeFromPathname("/ka/admin/products")).toBe("ka");
    expect(localeFromPathname("/admin")).toBe("ka");
  });
});
