import { describe, it, expect } from "vitest";

import { buildPublicUrl, mediaKey } from "@/lib/media/r2";
import { imageDeliveryUrl } from "@/lib/media/images";

describe("media url builders", () => {
  it("joins base + key without double slashes", () => {
    expect(buildPublicUrl("https://media.example.com/", "products/a.jpg")).toBe(
      "https://media.example.com/products/a.jpg",
    );
    expect(buildPublicUrl("https://media.example.com", "/products/a.jpg")).toBe(
      "https://media.example.com/products/a.jpg",
    );
  });

  it("namespaces and sanitizes media keys", () => {
    const key = mediaKey("products", "My Photo (1).JPG");
    expect(key).toMatch(/^products\/[0-9a-f-]{36}-my-photo-1-.jpg$/);
  });

  it("builds Cloudflare Images delivery URLs", () => {
    expect(imageDeliveryUrl("abc123", "img789")).toBe(
      "https://imagedelivery.net/abc123/img789/public",
    );
    expect(imageDeliveryUrl("abc123", "img789", "thumbnail")).toBe(
      "https://imagedelivery.net/abc123/img789/thumbnail",
    );
  });
});
