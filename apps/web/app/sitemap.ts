import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_PLATFORM_URL ?? "http://localhost:3000";
  const paths = ["/admin/login", "/admin/register"];

  return paths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "/admin/login" ? 1 : 0.8
  }));
}
