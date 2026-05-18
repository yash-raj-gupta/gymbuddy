import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, priority: 1 },
    { url: `${base}/pricing`, lastModified: now, priority: 0.8 },
    { url: `${base}/legal/terms`, lastModified: now, priority: 0.3 },
    { url: `${base}/legal/privacy`, lastModified: now, priority: 0.3 },
  ];
}
