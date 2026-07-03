import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicPage } from "@/lib/api/public";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { SectionRenderer } from "@/components/sections/SectionRenderer";
import { StructuredData } from "@/components/public/StructuredData";
import { brandFaviconUrl } from "@/lib/brand";

type PageProps = {
  params: Promise<{
    organizationSlug: string;
    pageSlug?: string[];
  }>;
};

function normalizePageSlug(pageSlug?: string[]): string {
  return pageSlug?.[0] ?? "home";
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  const page = await getPublicPage(resolved.organizationSlug, normalizePageSlug(resolved.pageSlug));

  return {
    title: page.seo.title,
    description: page.seo.description,
    alternates: {
      canonical: page.seo.canonical_url
    },
    icons: {
      icon: brandFaviconUrl(page.firm_name)
    },
    openGraph: {
      title: page.seo.title,
      description: page.seo.description,
      url: page.seo.canonical_url,
      type: "website"
    }
  };
}

export default async function TenantSitePage({ params }: PageProps) {
  const resolved = await params;
  const pageSlug = normalizePageSlug(resolved.pageSlug);

  if (!["home", "services", "about", "contact"].includes(pageSlug)) {
    notFound();
  }

  const page = await getPublicPage(resolved.organizationSlug, pageSlug);

  return (
    <div data-theme={page.theme_key}>
      <StructuredData page={page} />
      <PublicHeader page={page} />
      <main>
        <SectionRenderer page={page} />
      </main>
      <PublicFooter page={page} />
    </div>
  );
}
