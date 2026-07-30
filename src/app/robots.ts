import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Everything the middleware protects. These render nothing to a crawler
      // anyway — it gets bounced to /sign-in — so indexing them only spends
      // crawl budget on redirects.
      disallow: [
        "/dashboard",
        "/workout",
        "/exercises",
        "/routines",
        "/progress",
        "/history",
        "/api/",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
