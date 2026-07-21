import type { Metadata } from "next";
import { brandFaviconUrl } from "@/lib/brand";
import type { PublicSitePage } from "@/types/site";

function socialImage(page: PublicSitePage): string | undefined {
  for (const section of page.sections) {
    if (
      (section.section_type === "hero" ||
        section.section_type === "image_text" ||
        section.section_type === "founder_profile") &&
      section.content_json.image_url
    ) {
      return section.content_json.image_url;
    }
  }
  return undefined;
}

export function pageMetadata(page: PublicSitePage, index = true): Metadata {
  const image = socialImage(page);
  const images = image ? [{ url: image, alt: `${page.firm_name} in ${page.city}` }] : undefined;

  return {
    title: { absolute: page.seo.title },
    description: page.seo.description,
    alternates: {
      canonical: page.seo.canonical_url
    },
    robots: {
      index,
      follow: true,
      googleBot: {
        index,
        follow: true
      }
    },
    icons: {
      icon: brandFaviconUrl(page.firm_name)
    },
    openGraph: {
      title: page.seo.title,
      description: page.seo.description,
      url: page.seo.canonical_url,
      siteName: page.firm_name,
      locale: "en_IN",
      type: "website",
      images
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: page.seo.title,
      description: page.seo.description,
      images: image ? [image] : undefined
    }
  };
}
