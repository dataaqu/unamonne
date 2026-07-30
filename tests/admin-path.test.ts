import { describe, it, expect } from "vitest";

import { isAdminPathname, localeFromPathname } from "@/lib/auth/admin";

describe("admin path helpers", () => {
  it("matches the admin in either language", () => {
    // Georgian is unprefixed; English is not.
    expect(isAdminPathname("/admin")).toBe(true);
    expect(isAdminPathname("/admin/products")).toBe(true);
    expect(isAdminPathname("/en/admin")).toBe(true);
    expect(isAdminPathname("/en/admin/orders/42")).toBe(true);
    // The old prefixed form still gets gated on its way to the redirect.
    expect(isAdminPathname("/ka/admin")).toBe(true);
  });

  it("does not match anything else", () => {
    expect(isAdminPathname("/")).toBe(false);
    expect(isAdminPathname("/en")).toBe(false);
    expect(isAdminPathname("/en/login")).toBe(false);
    expect(isAdminPathname("/administrator")).toBe(false);
    expect(isAdminPathname("/en/administrator")).toBe(false);
  });

  it("extracts the locale, falling back to the default", () => {
    expect(localeFromPathname("/en/admin")).toBe("en");
    expect(localeFromPathname("/ka/admin/products")).toBe("ka");
    expect(localeFromPathname("/admin")).toBe("ka");
  });
});
