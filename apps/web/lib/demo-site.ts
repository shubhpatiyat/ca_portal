import type { PublicSitePage } from "@/types/site";

export const demoPage: PublicSitePage = {
  organization_id: "11111111-1111-4111-8111-111111111111",
  organization_slug: "sample-ca-firm",
  firm_name: "Sample CA Firm",
  city: "Your City",
  template_key: "modern_ca",
  theme_key: "navy_gold",
  page_slug: "home",
  page_title: "Home",
  published_at: "2026-06-30T09:00:00+05:30",
  seo: {
    title: "Outsourced Accounts Management for MSMEs | Sample CA Firm",
    description:
      "Expert outsourced accounts management for growing businesses: accurate books, on-time payments, full transparency. No in-house overhead. Free consultation.",
    canonical_url: "http://localhost:3000/s/sample-ca-firm"
  },
  contact: {
    phone: "+91 90000 12345",
    whatsapp: "https://wa.me/919000012345",
    email: "office@example.com",
    address: "Your office address"
  },
  legal_documents: {
    privacy_policy: { enabled: false, content: "" },
    terms_of_service: { enabled: false, content: "" },
    nda_confidentiality: { enabled: false, content: "" }
  },
  sections: [
    {
      id: "hero-home",
      section_type: "hero",
      position: 1,
      is_visible: true,
      variant: "image_right",
      content_json: {
        eyebrow: "Outsourced accounts management",
        title: "Accurate Books. On Time, Every Time.",
        description:
          "Get a dedicated team handling your books, payables, and receivables, so you can focus on growing the business, not chasing invoices.",
        image_url:
          "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
        primary_cta: { label: "Book a Free Consultation", href: "#contact" },
        secondary_cta: { label: "See How It Works", href: "#how-we-work" }
      }
    },
    {
      id: "services-home",
      section_type: "service_grid",
      position: 2,
      is_visible: true,
      variant: "two_columns",
      content_json: {
        heading: "Accounts operations without the in-house overhead",
        subheading:
          "A dependable back-office accounts team for growing businesses that need accuracy, visibility, and rhythm.",
        services: [
          {
            title: "Cost savings without compromise",
            description:
              "Hiring a full in-house accounts team means salaries, benefits, training, and turnover risk. We give you senior-level expertise at a fraction of the cost, with no hiring headaches.",
            icon: "BadgeIndianRupee"
          },
          {
            title: "Always on time, always accurate",
            description:
              "Late payments and reconciliation errors cost you money and relationships. Our process is built around deadlines: every invoice, every payment, every report, on schedule.",
            icon: "CalendarDays"
          },
          {
            title: "Built to scale with you",
            description:
              "Whether you process 50 invoices a month or 5,000, our systems flex with your growth. No need to rehire or retrain as you expand.",
            icon: "UsersRound"
          },
          {
            title: "Full transparency, no black box",
            description:
              "You get clear visibility into your accounts through dashboards, regular reports, and a direct line to your account manager. Nothing hidden, nothing delayed.",
            icon: "Eye"
          }
        ]
      }
    },
    {
      id: "pain-home",
      section_type: "image_text",
      position: 3,
      is_visible: true,
      variant: "image_right",
      content_json: {
        eyebrow: "Why we started this",
        heading: "Built for owners who need dependable accounts support.",
        body:
          "This firm did not start in a boardroom. It started from watching, up close, how small and medium businesses actually work. Growing up around a family business, and later working closely with MSMEs, we noticed a pattern: business owners were sharp at operations and strategy, but always stuck depending on finding the perfect accountant, someone who got the numbers right and was easy to communicate with. That is the gap we built this firm to close.",
        cta: { label: "Talk to us", href: "#contact" }
      }
    },
    {
      id: "process-home",
      section_type: "rich_text",
      position: 4,
      is_visible: true,
      variant: "article",
      content_json: {
        heading: "Onboarding in 5 Simple Steps",
        markdown:
          "1. Free consultation - We understand your business, current setup, and pain points.\n2. Custom proposal - Tailored scope of services and transparent pricing, with no hidden fees.\n3. Secure onboarding - NDA signed, document portal set up, and team assigned.\n4. Transition and setup - We migrate data, reconcile opening balances, and set workflows.\n5. Ongoing management - Monthly reporting, proactive compliance, and always-available support."
      }
    },
    {
      id: "security-home",
      section_type: "image_text",
      position: 5,
      is_visible: true,
      variant: "image_left",
      content_json: {
        eyebrow: "Data security and confidentiality",
        heading: "Your Financial Data, Handled with Care",
        body:
          "Your books contain some of the most sensitive information about your business, and we treat it that way. Financial documents and finalized reports are stored and managed on Microsoft OneDrive with Microsoft 365 security features including encryption and access controls. As we grow, we are implementing a formal data protection policy covering restricted physical device access, secured email communication, and controls against unauthorized third-party apps or websites on work systems. Our workspace is monitored by CCTV, and every team member signs an NDA before accessing client data. Security is part of how we are building the business from day one.",
        cta: { label: "Ask about our safeguards", href: "#contact" }
      }
    },
    {
      id: "faq-home",
      section_type: "faq",
      position: 6,
      is_visible: true,
      variant: "accordion",
      content_json: {
        heading: "Frequently Asked Questions",
        items: [
          {
            question: "How is my financial data kept secure?",
            answer: "Your data is protected through OneDrive and Microsoft 365 security, NDAs, and physical safeguards. See our Data Security section above for the full approach."
          },
          {
            question: "Do I have to change my CA?",
            answer: "No. We are not here to replace your Chartered Accountant. We bridge communication between you and your CA, and support them by keeping your books organized, accurate, and audit-ready."
          },
          {
            question: "What accounting software do you work with?",
            answer: "We currently work with Tally Prime, and we are actively expanding support for platforms including Marg, QuickBooks, Xero, and others. If your business uses another system, tell us and we can discuss compatibility."
          },
          {
            question: "How quickly can you onboard my business?",
            answer: "Typical onboarding takes 15 to 20 days, depending on account complexity and your current systems. We are refining the process toward onboarding most businesses in as little as one week."
          },
          {
            question: "How do I share raw documents or invoices with you?",
            answer: "You can share raw documents, invoices, statements, and other records through a dedicated shared drive from mobile, tablet, laptop, or desktop. You can also drop physical documents at our office."
          },
          {
            question: "Do you handle GST or tax filing, or only bookkeeping and accounts management?",
            answer: "Yes, we offer GST and tax filing services. It is optional: if you already have a CA or accountant for filings, we are happy to support that relationship rather than replace it."
          }
        ]
      }
    },
    {
      id: "cta-home",
      section_type: "cta_banner",
      position: 7,
      is_visible: true,
      variant: "solid",
      content_json: {
        heading: "Your Books, Our Move",
        description: "One conversation is all it takes to see what a well-managed accounts process can feel like.",
        primary_cta: { label: "Book a Free Consultation", href: "#contact" }
      }
    },
    {
      id: "contact-home",
      section_type: "contact_form",
      position: 8,
      is_visible: true,
      variant: "standard",
      content_json: {
        heading: "Your Books, Our Move",
        description:
          "One conversation is all it takes, whether you are here to see what a well-managed accounts process feels like or to explore joining the team behind it.",
        show_whatsapp: true,
        show_phone: true,
        show_email: true,
        show_map: true,
        business_hours: "Monday to Saturday, 10:00 AM to 6:00 PM"
      }
    }
  ]
};

export function pageFromSlug(pageSlug: string): PublicSitePage {
  if (pageSlug === "home") {
    return demoPage;
  }

  const serviceSection = demoPage.sections.find((section) => section.section_type === "service_grid");
  const aboutSection = demoPage.sections.find(
    (section) => section.section_type === "image_text" && /why we started this/i.test(section.content_json.eyebrow ?? "")
  );
  const contactSection = demoPage.sections.find((section) => section.section_type === "contact_form");

  const pageMap: Record<string, PublicSitePage> = {
    services: {
      ...demoPage,
      page_slug: "services",
      page_title: "Services",
      seo: {
        ...demoPage.seo,
        title: "Services | Sample CA Firm",
        canonical_url: "http://localhost:3000/s/sample-ca-firm/services"
      },
      sections: serviceSection ? [serviceSection, contactSection].filter(Boolean) as PublicSitePage["sections"] : demoPage.sections
    },
    about: {
      ...demoPage,
      page_slug: "about",
      page_title: "About",
      seo: {
        ...demoPage.seo,
        title: "About | Sample CA Firm",
        canonical_url: "http://localhost:3000/s/sample-ca-firm/about"
      },
      sections: aboutSection ? [aboutSection, contactSection].filter(Boolean) as PublicSitePage["sections"] : demoPage.sections
    },
    contact: {
      ...demoPage,
      page_slug: "contact",
      page_title: "Contact",
      seo: {
        ...demoPage.seo,
        title: "Contact | Sample CA Firm",
        canonical_url: "http://localhost:3000/s/sample-ca-firm/contact"
      },
      sections: contactSection ? [contactSection] : demoPage.sections
    }
  };

  return pageMap[pageSlug] ?? demoPage;
}
