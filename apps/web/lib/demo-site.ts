import type { PublicSitePage } from "@/types/site";

export const demoPage: PublicSitePage = {
  organization_id: "11111111-1111-4111-8111-111111111111",
  organization_slug: "sharma-associates",
  firm_name: "Sharma & Associates",
  city: "Jaipur",
  template_key: "modern_ca",
  theme_key: "navy_gold",
  page_slug: "home",
  page_title: "Home",
  published_at: "2026-06-30T09:00:00+05:30",
  seo: {
    title: "Sharma & Associates | Tax, GST and Compliance Support in Jaipur",
    description:
      "Chartered Accountants in Jaipur for income tax, GST, bookkeeping, payroll, audit support and business compliance.",
    canonical_url: "http://localhost:3000/s/sharma-associates"
  },
  contact: {
    phone: "+91 90000 12345",
    whatsapp: "https://wa.me/919000012345",
    email: "office@sharmaassociates.in",
    address: "C-Scheme, Jaipur, Rajasthan 302001"
  },
  sections: [
    {
      id: "hero-home",
      section_type: "hero",
      position: 1,
      is_visible: true,
      variant: "image_right",
      content_json: {
        eyebrow: "Trusted CA Services",
        title: "Trusted Tax, GST and Compliance Support in Jaipur",
        description:
          "Launch reliable compliance workflows with a CA firm that keeps your books, filings and decisions moving without last-minute stress.",
        image_url:
          "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
        primary_cta: { label: "Book a consultation", href: "#contact" },
        secondary_cta: { label: "View services", href: "/s/sharma-associates/services" }
      }
    },
    {
      id: "trust-home",
      section_type: "trust_stats",
      position: 2,
      is_visible: true,
      variant: "cards",
      content_json: {
        heading: "Calm, measurable compliance support",
        stats: [
          { value: "40+", label: "SMEs supported" },
          { value: "12 yrs", label: "Practice experience" },
          { value: "100%", label: "Deadline visibility" }
        ]
      }
    },
    {
      id: "services-home",
      section_type: "service_grid",
      position: 3,
      is_visible: true,
      variant: "three_columns",
      content_json: {
        heading: "Services your firm can publish in minutes",
        subheading:
          "Choose approved CA service blocks, edit plain-language descriptions, and keep the site consistent.",
        services: [
          {
            title: "Income Tax Filing",
            description: "Planning, return preparation and notice support for individuals and business owners.",
            icon: "ReceiptIndianRupee"
          },
          {
            title: "GST Registration & Returns",
            description: "Registration, monthly returns, reconciliation and advisory for growing businesses.",
            icon: "BadgeIndianRupee"
          },
          {
            title: "Accounting & Bookkeeping",
            description: "Clean monthly books, reports and review rhythms your team can trust.",
            icon: "BookOpenCheck"
          },
          {
            title: "TDS & Payroll Compliance",
            description: "Salary processing, TDS returns and statutory compliance calendars.",
            icon: "UsersRound"
          },
          {
            title: "Audit & Financial Reporting",
            description: "Audit-ready statements and management reporting for better decisions.",
            icon: "FileCheck2"
          }
        ]
      }
    },
    {
      id: "pain-home",
      section_type: "image_text",
      position: 4,
      is_visible: true,
      variant: "image_right",
      content_json: {
        eyebrow: "When finance work starts slipping",
        heading: "We help stabilize the back office before it slows growth.",
        body:
          "Books behind schedule, compliance deadlines approaching, and documents scattered across email and WhatsApp can slow down business decisions. We bring the work back into a clear monthly rhythm.",
        cta: { label: "Talk to us", href: "#contact" }
      }
    },
    {
      id: "process-home",
      section_type: "rich_text",
      position: 5,
      is_visible: true,
      variant: "article",
      content_json: {
        heading: "How we work",
        markdown:
          "1. Free consultation - We understand your current setup and pain points.\n2. Custom proposal - You get a clear scope and transparent pricing.\n3. Secure onboarding - Documents, access, and responsibilities are set up safely.\n4. Transition and cleanup - We reconcile data and set monthly workflows.\n5. Ongoing management - You get reporting, compliance reminders, and support."
      }
    },
    {
      id: "security-home",
      section_type: "image_text",
      position: 6,
      is_visible: true,
      variant: "image_left",
      content_json: {
        eyebrow: "Data security",
        heading: "Sensitive financial data is handled with controlled access.",
        body:
          "Client documents, credentials, and financial records need careful handling. Secure document workflows, role-based access, review trails, and confidentiality practices make onboarding safer.",
        cta: { label: "Read security policy", href: "/security" }
      }
    },
    {
      id: "founder-home",
      section_type: "founder_profile",
      position: 7,
      is_visible: true,
      variant: "portrait_card",
      content_json: {
        founder_name: "CA Anirudh Sharma",
        designation: "Founder and Senior Partner",
        bio:
          "Anirudh works with founders and family businesses that want dependable compliance without generic agency templates or confusing CMS screens.",
        image_url:
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=900&q=80",
        credentials: ["FCA", "DISA (ICAI)", "GST and income tax advisory"]
      }
    },
    {
      id: "faq-home",
      section_type: "faq",
      position: 8,
      is_visible: true,
      variant: "accordion",
      content_json: {
        heading: "Questions clients ask before contacting us",
        items: [
          {
            question: "Can you take over from another accountant mid-year?",
            answer:
              "Yes. We review your current books, reconcile opening balances and create a transition plan before filing deadlines."
          },
          {
            question: "Do you support startups and small businesses?",
            answer:
              "Yes. The default service mix includes GST, payroll, bookkeeping, TDS and business registration support."
          },
          {
            question: "Can I preview changes before publishing?",
            answer:
              "Yes. Draft edits stay private until an owner reviews the preview and publishes the revision."
          }
        ]
      }
    },
    {
      id: "cta-home",
      section_type: "cta_banner",
      position: 9,
      is_visible: true,
      variant: "solid",
      content_json: {
        heading: "Ready to make finance work predictable?",
        description: "Start with a short consultation and leave with a clearer next step.",
        primary_cta: { label: "Book a free call", href: "#contact" }
      }
    },
    {
      id: "contact-home",
      section_type: "contact_form",
      position: 10,
      is_visible: true,
      variant: "standard",
      content_json: {
        heading: "Start with a practical consultation",
        description:
          "Tell us what you need help with. We will respond with the right next step for tax, GST, bookkeeping or compliance work.",
        show_whatsapp: true,
        show_phone: true,
        show_email: true,
        show_map: true
      }
    }
  ]
};

export function pageFromSlug(pageSlug: string): PublicSitePage {
  if (pageSlug === "home") {
    return demoPage;
  }

  const serviceSection = demoPage.sections.find((section) => section.section_type === "service_grid");
  const founderSection = demoPage.sections.find((section) => section.section_type === "founder_profile");
  const contactSection = demoPage.sections.find((section) => section.section_type === "contact_form");

  const pageMap: Record<string, PublicSitePage> = {
    services: {
      ...demoPage,
      page_slug: "services",
      page_title: "Services",
      seo: {
        ...demoPage.seo,
        title: "Services | Sharma & Associates",
        canonical_url: "http://localhost:3000/s/sharma-associates/services"
      },
      sections: serviceSection ? [serviceSection, contactSection].filter(Boolean) as PublicSitePage["sections"] : demoPage.sections
    },
    about: {
      ...demoPage,
      page_slug: "about",
      page_title: "About",
      seo: {
        ...demoPage.seo,
        title: "About | Sharma & Associates",
        canonical_url: "http://localhost:3000/s/sharma-associates/about"
      },
      sections: founderSection ? [founderSection, contactSection].filter(Boolean) as PublicSitePage["sections"] : demoPage.sections
    },
    contact: {
      ...demoPage,
      page_slug: "contact",
      page_title: "Contact",
      seo: {
        ...demoPage.seo,
        title: "Contact | Sharma & Associates",
        canonical_url: "http://localhost:3000/s/sharma-associates/contact"
      },
      sections: contactSection ? [contactSection] : demoPage.sections
    }
  };

  return pageMap[pageSlug] ?? demoPage;
}
