import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicPage } from "@/lib/api/public";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicAnalytics } from "@/components/public/PublicAnalytics";
import { SectionRenderer } from "@/components/sections/SectionRenderer";
import { StructuredData } from "@/components/public/StructuredData";
import { pageMetadata } from "@/lib/seo";

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

  return pageMetadata(page, false);
}

export default async function TenantSitePage({ params }: PageProps) {
  const resolved = await params;
  const pageSlug = normalizePageSlug(resolved.pageSlug);

  if (!["home", "services", "about", "contact", "privacy-policy", "terms-of-service", "nda-confidentiality"].includes(pageSlug)) {
    notFound();
  }

  const page = await getPublicPage(resolved.organizationSlug, pageSlug);

  return (
    <div className="public-site" data-theme={page.theme_key}>
      <StructuredData page={page} />
      <PublicAnalytics page={page} />
      <PublicHeader page={page} />
      <main>
        <SectionRenderer page={page} />
      </main>
      <PublicFooter page={page} />
    </div>
  );
}
