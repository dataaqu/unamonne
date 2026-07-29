import { describe, it, expect } from "vitest";

import {
  addressFormSchema,
  extractAddressForm,
  markDefault,
  shouldDefaultOnCreate,
} from "@/lib/account/address-schema";

function form(values: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

describe("addressFormSchema", () => {
  it("accepts a complete address and uppercases the country", () => {
    const parsed = addressFormSchema.safeParse(
      extractAddressForm(
        form({
          fullName: "Nino Beridze",
          phone: "+995 555 10 20 30",
          country: "ge",
          city: "Tbilisi",
          line1: "12 Rustaveli Ave",
          postalCode: "0108",
        }),
      ),
    );
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.country).toBe("GE");
      expect(parsed.data.line2).toBeNull();
    }
  });

  it("requires name, country, city, and line1", () => {
    const parsed = addressFormSchema.safeParse(
      extractAddressForm(form({ fullName: "", country: "", city: "", line1: "" })),
    );
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      expect(fields.fullName).toBeTruthy();
      expect(fields.country).toBeTruthy();
      expect(fields.city).toBeTruthy();
      expect(fields.line1).toBeTruthy();
    }
  });

  it("rejects a country that is not a two-letter code", () => {
    const parsed = addressFormSchema.safeParse(
      extractAddressForm(
        form({
          fullName: "A",
          country: "Georgia",
          city: "Tbilisi",
          line1: "x",
        }),
      ),
    );
    expect(parsed.success).toBe(false);
  });
});

describe("shouldDefaultOnCreate", () => {
  it("makes the first address default even if not requested", () => {
    expect(shouldDefaultOnCreate(0, false)).toBe(true);
  });

  it("respects an explicit request on a later address", () => {
    expect(shouldDefaultOnCreate(3, true)).toBe(true);
  });

  it("leaves a later address non-default by default", () => {
    expect(shouldDefaultOnCreate(3, false)).toBe(false);
  });
});

describe("markDefault", () => {
  it("sets the target default and clears every other", () => {
    const result = markDefault(
      [
        { id: "a", isDefault: true },
        { id: "b", isDefault: false },
        { id: "c", isDefault: false },
      ],
      "b",
    );
    expect(result).toEqual([
      { id: "a", isDefault: false },
      { id: "b", isDefault: true },
      { id: "c", isDefault: false },
    ]);
  });
});
