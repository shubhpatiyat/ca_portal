import type { FaqSection, PublicSitePage } from "@/types/site";

export function StructuredData({ page }: { page: PublicSitePage }) {
  const faqSection = page.sections.find((section): section is FaqSection => section.section_type === "faq" && section.is_visible);
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: page.firm_name,
    address: page.contact.address,
    telephone: page.contact.phone,
    email: page.contact.email,
    areaServed: page.city,
    url: page.seo.canonical_url
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `http://localhost:3000/s/${page.organization_slug}`
      },
      {
        "@type": "ListItem",
        position: 2,
        name: page.page_title,
        item: page.seo.canonical_url
      }
    ]
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      {faq ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} /> : null}
    </>
  );
}
