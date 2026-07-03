import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_PLATFORM_URL ?? "http://localhost:3000";
  const paths = ["", "/services", "/about", "/contact"];

  return paths.map((path) => ({
    url: `${baseUrl}/s/sharma-associates${path}`,
    lastModified: new Date("2026-06-30"),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.8
  }));
}
