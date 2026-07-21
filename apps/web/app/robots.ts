import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getPublicPageByHost, normalizePublicHost } from "@/lib/api/public";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const requestHeaders = await headers();
  const host = normalizePublicHost(requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"));

  try {
    const home = await getPublicPageByHost(host, "home");
    const origin = new URL(home.seo.canonical_url).origin;
    return {
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/auth", "/client", "/s/"]
      },
      sitemap: `${origin}/sitemap.xml`,
      host: origin
    };
  } catch {
    return {
      rules: {
        userAgent: "*",
        disallow: "/"
      }
    };
  }
}
