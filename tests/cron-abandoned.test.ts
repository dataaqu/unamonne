import { describe, it, expect } from "vitest";

import { isAuthorizedCron, makeOfferCode } from "@/lib/abandoned-cart";

describe("isAuthorizedCron", () => {
  it("accepts the configured bearer secret", () => {
    expect(isAuthorizedCron("Bearer s3cret", "s3cret")).toBe(true);
  });

  it("rejects a wrong or missing header", () => {
    expect(isAuthorizedCron("Bearer nope", "s3cret")).toBe(false);
    expect(isAuthorizedCron(null, "s3cret")).toBe(false);
  });

  it("fails closed when no secret is configured", () => {
    expect(isAuthorizedCron("Bearer anything", undefined)).toBe(false);
    expect(isAuthorizedCron("Bearer ", "")).toBe(false);
  });
});

describe("makeOfferCode", () => {
  it("builds a prefixed uppercase code", () => {
    const code = makeOfferCode(() => "abcdef12-0000-0000-0000-000000000000");
    expect(code).toBe("COMEBACK-ABCD");
  });

  it("produces distinct codes for distinct input", () => {
    let n = 0;
    const gen = () => `${n++}bcdef00-0000-0000-0000-000000000000`;
    expect(makeOfferCode(gen)).not.toBe(makeOfferCode(gen));
  });
});
