import type { MetadataRoute } from "next";

import { appUrl } from "@/lib/email/client";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private + non-indexable areas.
      disallow: ["/api/", "/*/admin", "/*/account", "/*/checkout"],
    },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
