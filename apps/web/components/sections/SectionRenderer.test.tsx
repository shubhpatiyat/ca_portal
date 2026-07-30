import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { demoPage, pageFromSlug } from "../../lib/demo-site";
import { SectionRenderer } from "./SectionRenderer";

describe("SectionRenderer", () => {
  it("renders the redesigned home journey from tenant section data", () => {
    const html = renderToStaticMarkup(<SectionRenderer page={demoPage} />);

    expect(html).toContain('id="home"');
    expect(html).toContain("Accurate Books. On Time, Every Time.");
    expect(html).toContain("Books on schedule");
    expect(html).toContain('id="about"');
    expect(html).toContain('id="how-we-work"');
    expect(html).toContain('id="security"');
    expect(html).toContain('id="faq"');
    expect(html).toContain('id="contact"');
    expect(html).toContain("Book a Free Consultation");
  });

  it("adds a page introduction when a secondary page has no hero", () => {
    const servicesPage = pageFromSlug("services");
    const html = renderToStaticMarkup(<SectionRenderer page={servicesPage} />);

    expect(html).toContain("Services built around your business");
    expect(html).toContain("Accounts operations without the in-house overhead");
  });

  it("renders enabled legal document text as a dedicated page", () => {
    const legalPage = {
      ...demoPage,
      page_slug: "privacy-policy",
      page_title: "Privacy Policy",
      legal_documents: {
        ...demoPage.legal_documents,
        privacy_policy: {
          enabled: true,
          content: "We collect only the information needed to provide our services.\n\nWe protect client records."
        }
      },
      sections: []
    };
    const html = renderToStaticMarkup(<SectionRenderer page={legalPage} />);

    expect(html).toContain("Privacy Policy");
    expect(html).toContain("We collect only the information needed");
    expect(html).toContain("We protect client records.");
  });
});
