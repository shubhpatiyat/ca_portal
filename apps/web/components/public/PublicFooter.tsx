import { ArrowUpRight, Mail, Phone } from "lucide-react";
import { EMPTY_LEGAL_DOCUMENTS } from "@/types/site";
import type { PublicSitePage } from "@/types/site";

const quickLinks = [
  ["About Us", "#about"],
  ["How It Works", "#how-we-work"],
  ["Data Security", "#security"],
  ["FAQ", "#faq"],
  ["Contact Us", "#contact"],
  ["Careers", "#contact"]
] as const;

export function PublicFooter({ page, basePath }: { page: PublicSitePage; basePath?: string }) {
  const base = basePath ?? `/s/${page.organization_slug}`;
  const homePath = base || "/";
  const documents = page.legal_documents ?? EMPTY_LEGAL_DOCUMENTS;
  const legalLinks = [
    { label: "Privacy Policy", href: `${base}/privacy-policy`, document: documents.privacy_policy },
    { label: "Terms of Service", href: `${base}/terms-of-service`, document: documents.terms_of_service },
    { label: "NDA & Confidentiality Commitment", href: `${base}/nda-confidentiality`, document: documents.nda_confidentiality }
  ].filter((item) => item.document.enabled && item.document.content.trim());
  return (
    <footer className="bg-[#0b1f33] text-white">
      <div className="section-shell py-14 sm:py-16">
        <div className="grid gap-12 border-b border-white/10 pb-12 md:grid-cols-[1.25fr_1fr_1fr]">
          <div>
            <p className="text-xl font-extrabold tracking-[-0.03em]">{page.firm_name}</p>
            <p className="mt-4 max-w-sm text-sm leading-7 text-white/65">
              Outsourced accounts management for growing businesses — accurate books, no overhead.
            </p>
            <div className="mt-6 flex gap-2">
              <a
                className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/70 transition hover:border-[#8bc5ff] hover:text-[#8bc5ff]"
                href={`mailto:${page.contact.email}`}
                aria-label={`Email ${page.firm_name}`}
              >
                <Mail size={17} />
              </a>
              <a
                className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/70 transition hover:border-[#8bc5ff] hover:text-[#8bc5ff]"
                href={`tel:${page.contact.phone}`}
                aria-label={`Call ${page.firm_name}`}
              >
                <Phone size={17} />
              </a>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold">Quick Links</h2>
            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-white/60 md:grid-cols-1">
              {quickLinks.map(([label, href]) => (
                <a className="transition hover:text-white" href={`${homePath}${href}`} key={label}>
                  {label}
                </a>
              ))}
            </div>
          </div>

          {legalLinks.length ? (
            <div>
              <h2 className="text-sm font-bold">Legal</h2>
              <div className="mt-5 grid gap-3 text-sm text-white/60">
                {legalLinks.map((item) => (
                  <a className="transition hover:text-white" href={item.href} key={item.label}>{item.label}</a>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-5 pt-8 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {page.firm_name}. All rights reserved.</p>
          <a className="inline-flex items-center gap-1.5 font-bold text-[#8bc5ff] transition hover:text-white" href={`${homePath}#contact`}>
            Book a Free Consultation
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
