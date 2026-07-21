import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getPublicPageByHost, normalizePublicHost } from "@/lib/api/public";

export const dynamic = "force-dynamic";

const publicPaths = ["", "/services", "/about", "/contact"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const requestHeaders = await headers();
  const host = normalizePublicHost(requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"));
  if (!host) {
    return [];
  }

  try {
    const home = await getPublicPageByHost(host, "home");
    const origin = new URL(home.seo.canonical_url).origin;
    return publicPaths.map((path) => ({
      url: `${origin}${path}`,
      lastModified: new Date(home.published_at),
      changeFrequency: path ? "monthly" : "weekly",
      priority: path ? 0.8 : 1
    }));
  } catch {
    return [];
  }
}
