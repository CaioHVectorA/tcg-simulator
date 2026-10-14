import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return [{ url: `${site}/`, changeFrequency: "weekly", priority: 1, alternates: { languages: { pt: `${site}/?lang=pt`, en: `${site}/?lang=en`, es: `${site}/?lang=es`, ja: `${site}/?lang=jp` } } }];
}
