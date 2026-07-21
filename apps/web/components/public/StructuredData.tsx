import type { FaqSection, PublicSitePage } from "@/types/site";

function jsonLd(value: object): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function StructuredData({ page }: { page: PublicSitePage }) {
  const faqSection = page.sections.find((section): section is FaqSection => section.section_type === "faq" && section.is_visible);
  const homeUrl = new URL("/", page.seo.canonical_url).toString();
  const postalCode = page.contact.address.match(/\b\d{6}\b/)?.[0];
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "AccountingService",
    "@id": `${homeUrl}#business`,
    name: page.firm_name,
    description: page.seo.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: page.contact.address,
      addressLocality: page.city,
      postalCode,
      addressCountry: "IN"
    },
    telephone: page.contact.phone,
    email: page.contact.email,
    areaServed: {
      "@type": "City",
      name: page.city
    },
    url: homeUrl
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${homeUrl}#website`,
    name: page.firm_name,
    url: homeUrl
  };
  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.seo.title,
    description: page.seo.description,
    url: page.seo.canonical_url,
    isPartOf: {
      "@id": `${homeUrl}#website`
    },
    about: {
      "@id": `${homeUrl}#business`
    }
  };
  const breadcrumbItems = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: homeUrl
    }
  ];
  if (page.page_slug !== "home") {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: page.page_title,
      item: page.seo.canonical_url
    });
  }
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems
  };
  const faq = faqSection
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqSection.content_json.items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer
          }
        }))
      }
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(localBusiness) }} />
      {page.page_slug === "home" ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(website) }} />
      ) : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(webPage) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />
      {faq ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faq) }} /> : null}
    </>
  );
}
