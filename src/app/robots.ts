import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/email/client";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private + non-indexable areas. Georgian is unprefixed and English is
      // not, so each one is named twice.
      disallow: [
        "/api/",
        "/admin",
        "/account",
        "/checkout",
        "/*/admin",
        "/*/account",
        "/*/checkout",
      ],
    },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
