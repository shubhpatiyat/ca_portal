import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { demoPage } from "../../lib/demo-site";
import type { PublicSitePage } from "../../types/site";
import { PublicFooter } from "./PublicFooter";

describe("PublicFooter", () => {
  it("shows only enabled legal documents with content", () => {
    const page = {
      ...demoPage,
      legal_documents: {
        privacy_policy: { enabled: true, content: "A complete privacy policy for website visitors." },
        terms_of_service: { enabled: false, content: "Draft terms remain private." },
        nda_confidentiality: { enabled: true, content: "A complete confidentiality commitment for clients." }
      }
    };
    const html = renderToStaticMarkup(<PublicFooter page={page} basePath="" />);

    expect(html).toContain('href="/privacy-policy"');
    expect(html).toContain('href="/nda-confidentiality"');
    expect(html).not.toContain('href="/terms-of-service"');
    expect(html).not.toContain("lvh.me");
  });

  it("handles an older API response without legal documents", () => {
    const page = { ...demoPage, legal_documents: undefined } as unknown as PublicSitePage;
    const html = renderToStaticMarkup(<PublicFooter page={page} basePath="" />);

    expect(html).toContain(demoPage.firm_name);
    expect(html).not.toContain(">Legal<");
  });
});
