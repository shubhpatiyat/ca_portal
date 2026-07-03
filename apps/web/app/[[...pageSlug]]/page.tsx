import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { SectionRenderer } from "@/components/sections/SectionRenderer";
import { StructuredData } from "@/components/public/StructuredData";
import { getPublicPageByHost, normalizePublicHost } from "@/lib/api/public";
import { brandFaviconUrl } from "@/lib/brand";

type PageProps = {
  params: Promise<{
    pageSlug?: string[];
  }>;
};

const publicPages = new Set(["home", "services", "about", "contact"]);

function normalizePageSlug(pageSlug?: string[]): string | null {
  if (!pageSlug?.length) {
    return "home";
  }
  if (pageSlug.length > 1) {
    return null;
  }
  return pageSlug[0] ?? "home";
}

async function currentHost(): Promise<string> {
  const requestHeaders = await headers();
  return normalizePublicHost(requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"));
}

function isWorkspaceHost(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  const pageSlug = normalizePageSlug(resolved.pageSlug);
  if (!pageSlug || !publicPages.has(pageSlug)) {
    return {};
  }

  try {
    const page = await getPublicPageByHost(await currentHost(), pageSlug);
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
  } catch {
    return {
      title: "CA Site Platform"
    };
  }
}

export default async function HostTenantSitePage({ params }: PageProps) {
  const resolved = await params;
  const pageSlug = normalizePageSlug(resolved.pageSlug);
  if (!pageSlug || !publicPages.has(pageSlug)) {
    notFound();
  }

  const host = await currentHost();
  try {
    const page = await getPublicPageByHost(host, pageSlug);
    return (
      <div data-theme={page.theme_key}>
        <StructuredData page={page} />
        <PublicHeader page={page} basePath="" />
        <main>
          <SectionRenderer page={page} />
        </main>
        <PublicFooter page={page} />
      </div>
    );
  } catch {
    if (isWorkspaceHost(host)) {
      redirect("/s/sharma-associates");
    }
    notFound();
  }
}
