import { describe, it, expect } from "vitest";

import { routing } from "@/i18n/routing";
import ka from "../messages/ka.json";
import en from "../messages/en.json";

describe("i18n routing", () => {
  it("supports ka + en with ka as default", () => {
    expect(routing.locales).toEqual(["ka", "en"]);
    expect(routing.defaultLocale).toBe("ka");
    // Georgian is the bare address; English carries the prefix.
    expect(routing.localePrefix).toBe("as-needed");
  });

  it("keeps message catalogs structurally in sync", () => {
    const keys = (obj: Record<string, unknown>) => Object.keys(obj).sort();
    expect(keys(ka)).toEqual(keys(en));
    expect(keys(ka.HomePage)).toEqual(keys(en.HomePage));
    expect(keys(ka.Metadata)).toEqual(keys(en.Metadata));
    expect(keys(ka.Cart)).toEqual(keys(en.Cart));
    expect(keys(ka.Cart.errors)).toEqual(keys(en.Cart.errors));
    expect(keys(ka.Admin)).toEqual(keys(en.Admin));
    expect(keys(ka.Admin.shipping)).toEqual(keys(en.Admin.shipping));
  });
});
