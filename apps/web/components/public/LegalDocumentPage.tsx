import { EMPTY_LEGAL_DOCUMENTS } from "@/types/site";
import type { LegalDocument, PublicSitePage } from "@/types/site";

const legalPages: Record<string, { title: string; document: keyof PublicSitePage["legal_documents"] }> = {
  "privacy-policy": { title: "Privacy Policy", document: "privacy_policy" },
  "terms-of-service": { title: "Terms of Service", document: "terms_of_service" },
  "nda-confidentiality": { title: "NDA & Confidentiality Commitment", document: "nda_confidentiality" }
};

export function isLegalPageSlug(slug: string): boolean {
  return slug in legalPages;
}

export function LegalDocumentPage({ page }: { page: PublicSitePage }) {
  const definition = legalPages[page.page_slug];
  if (!definition) return null;
  const document: LegalDocument = (page.legal_documents ?? EMPTY_LEGAL_DOCUMENTS)[definition.document];
  const paragraphs = document.content.split(/\n\s*\n/).map((value) => value.trim()).filter(Boolean);

  return (
    <section className="public-grid-pattern bg-[#f7fafc] pb-20 pt-32 sm:pb-24 sm:pt-40">
      <div className="section-shell">
        <div className="mx-auto max-w-3xl">
          <p className="public-eyebrow">Legal</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[#0b1f33] sm:text-6xl">{definition.title}</h1>
          <p className="mt-4 text-sm text-[#516173]">{page.firm_name}</p>
          <article className="mt-10 rounded-[28px] border border-[#d8e2ec] bg-white p-6 shadow-[0_20px_60px_rgba(11,31,51,0.07)] sm:p-10">
            <div className="grid gap-6 text-[15px] leading-8 text-[#516173]">
              {paragraphs.map((paragraph, index) => (
                <p className="whitespace-pre-line" key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
