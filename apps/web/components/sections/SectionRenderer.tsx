import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  BadgeIndianRupee,
  BookOpenCheck,
  CalendarDays,
  ClipboardList,
  EyeOff,
  FileCheck2,
  ReceiptIndianRupee,
  ShieldCheck,
  UsersRound
} from "lucide-react";
import type {
  ContactFormSection,
  CtaBannerSection,
  FaqSection,
  FounderProfileSection,
  HeroSection,
  ImageTextSection,
  PageSection,
  PublicSitePage,
  RichTextSection,
  ServiceGridSection,
  TestimonialsSection,
  TrustStatsSection
} from "@/types/site";
import { LeadForm } from "@/components/public/LeadForm";

type SectionProps<T extends PageSection> = {
  section: T;
  page: PublicSitePage;
};

const iconRegistry = {
  ReceiptIndianRupee,
  BadgeIndianRupee,
  BookOpenCheck,
  UsersRound,
  FileCheck2
};

const fallbackImages = {
  hero: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
  office: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
  founder: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=900&q=80"
};

function SectionButton({ href, label, secondary = false }: { href: string; label: string; secondary?: boolean }) {
  const classes = secondary
    ? "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-secondary px-7 py-3 text-sm font-semibold uppercase tracking-[0.05em] text-secondary transition hover:bg-secondary/10"
    : "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-secondary px-7 py-3 text-sm font-semibold uppercase tracking-[0.05em] text-secondary-foreground shadow-sm transition hover:shadow-lg active:scale-95";

  if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("https://")) {
    return (
      <a className={classes} href={href}>
        {label}
      </a>
    );
  }

  return (
    <Link className={classes} href={href}>
      {label}
    </Link>
  );
}

function Hero({ section, page }: SectionProps<HeroSection>) {
  const content = section.content_json;
  const centered = section.variant === "centered";
  const imageUrl = content.image_url || fallbackImages.hero;

  return (
    <section className="hero-gradient relative overflow-hidden pt-32 pb-24 lg:pt-36 lg:pb-32" id="home">
      <div className={`section-shell grid gap-16 ${centered ? "text-center" : "items-center lg:grid-cols-2"}`}>
        <div className={centered ? "mx-auto max-w-3xl" : "max-w-2xl"}>
          <p className="mb-6 inline-block rounded-full bg-[#bceecf] px-4 py-1 text-sm font-semibold uppercase tracking-[0.18em] text-[#224f39]">
            {content.eyebrow}
          </p>
          <h1 className="font-serif text-4xl font-bold leading-tight text-primary md:text-6xl">{content.title}</h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">{content.description}</p>
          <div className={`mt-10 flex flex-col gap-4 sm:flex-row ${centered ? "justify-center" : ""}`}>
            <SectionButton href={content.primary_cta.href} label={content.primary_cta.label} />
            {content.secondary_cta ? (
              <SectionButton href={content.secondary_cta.href} label={content.secondary_cta.label} secondary />
            ) : null}
          </div>
        </div>
        {!centered ? (
          <div className="group relative hidden lg:block">
            <div className="absolute -inset-4 rounded-[1.5rem] bg-secondary/5 blur-2xl transition group-hover:bg-secondary/10" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-muted shadow-2xl">
              <Image
                src={imageUrl}
                alt={`${page.firm_name} client consultation`}
                fill
                className="object-cover grayscale-[0.2] transition duration-700 group-hover:grayscale-0"
                sizes="(min-width: 1024px) 48vw, 100vw"
                priority
              />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-xl border border-border bg-background p-6 shadow-xl md:block">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-secondary" size={34} aria-hidden="true" />
                <div>
                  <div className="font-serif text-2xl font-semibold text-primary">₹50Cr+</div>
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Tax work managed</div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function TrustStats({ section }: SectionProps<TrustStatsSection>) {
  return (
    <section className="border-y border-border bg-white py-10">
      <div className="section-shell">
        <h2 className="sr-only">{section.content_json.heading}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {section.content_json.stats.map((stat) => (
            <div className="rounded-xl border border-border bg-background p-7" key={stat.label}>
              <strong className="block font-serif text-4xl font-semibold text-primary">{stat.value}</strong>
              <span className="mt-2 block text-sm text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceGrid({ section }: SectionProps<ServiceGridSection>) {
  const columns = section.variant === "two_columns" ? "md:grid-cols-2" : "md:grid-cols-3";

  return (
    <section className="bg-background py-24" id="services">
      <div className="section-shell">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-semibold text-primary md:text-5xl">{section.content_json.heading}</h2>
          {section.content_json.subheading ? (
            <p className="mt-4 leading-7 text-muted-foreground">{section.content_json.subheading}</p>
          ) : null}
        </div>
        <div className={`mt-16 grid gap-8 ${columns}`}>
          {section.content_json.services.map((service) => {
            const Icon = iconRegistry[service.icon as keyof typeof iconRegistry] ?? FileCheck2;
            return (
              <article className="group rounded-xl border border-border bg-muted/55 p-8 transition hover:border-secondary" key={service.title}>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10 text-secondary transition group-hover:bg-secondary group-hover:text-white">
                  <Icon size={22} aria-hidden="true" />
                </div>
                <h3 className="font-serif text-2xl font-semibold text-primary">{service.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{service.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ImageText({ section }: SectionProps<ImageTextSection>) {
  const text = `${section.content_json.eyebrow ?? ""} ${section.content_json.heading} ${section.content_json.body}`;
  if (/security|secure|confidential|data|document/i.test(text)) {
    return <SecuritySection section={section} />;
  }
  if (/behind|slipping|deadline|cash flow|messy|pain|problem|growth/i.test(text)) {
    return <PainSection section={section} />;
  }

  const reverse = section.variant === "image_right";
  const imageUrl = section.content_json.image_url || fallbackImages.office;
  return (
    <section className="bg-white py-24">
      <div className={`section-shell grid gap-16 lg:grid-cols-2 lg:items-center ${reverse ? "" : "lg:[&>*:first-child]:order-2"}`}>
        <div>
          {section.content_json.eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary">{section.content_json.eyebrow}</p>
          ) : null}
          <h2 className="mt-3 font-serif text-3xl font-semibold text-primary md:text-5xl">{section.content_json.heading}</h2>
          <p className="mt-5 leading-8 text-muted-foreground">{section.content_json.body}</p>
          {section.content_json.cta ? (
            <div className="mt-7">
              <SectionButton href={section.content_json.cta.href} label={section.content_json.cta.label} />
            </div>
          ) : null}
        </div>
        <div className="relative min-h-[360px] overflow-hidden rounded-3xl border border-border bg-muted shadow-2xl">
          <Image src={imageUrl} alt={section.content_json.heading} fill className="object-cover" sizes="50vw" />
        </div>
      </div>
    </section>
  );
}

function PainSection({ section }: { section: ImageTextSection }) {
  const cards = [
    {
      title: "Struggling with messy books?",
      body: "Inaccurate records and unrecorded transactions make financial reporting unreliable.",
      icon: ClipboardList
    },
    {
      title: "Fearing compliance deadlines?",
      body: "GST, TDS, payroll, and tax filings become stressful when ownership is unclear.",
      icon: AlertTriangle
    },
    {
      title: "No visibility into cash flow?",
      body: "Founders end up making decisions without current numbers or monthly clarity.",
      icon: EyeOff
    }
  ];

  return (
    <section className="border-y border-border bg-white py-24">
      <div className="section-shell text-center">
        <h2 className="mx-auto max-w-3xl font-serif text-3xl font-semibold text-primary md:text-5xl">{section.content_json.heading}</h2>
        <p className="mx-auto mt-4 max-w-3xl leading-8 text-muted-foreground">{section.content_json.body}</p>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <article className="rounded-xl border border-border bg-background p-8 text-center transition hover:border-destructive/40" key={card.title}>
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/5 text-destructive">
                  <Icon size={30} aria-hidden="true" />
                </div>
                <h3 className="font-serif text-2xl font-semibold text-primary">{card.title}</h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">{card.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SecuritySection({ section }: { section: ImageTextSection }) {
  const imageUrl = section.content_json.image_url || fallbackImages.office;

  return (
    <section className="bg-primary py-24 text-primary-foreground" id="security">
      <div className="section-shell grid gap-16 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="font-serif text-3xl font-semibold text-white md:text-5xl">{section.content_json.heading}</h2>
          <p className="mt-6 text-lg leading-8 text-primary-foreground/80">{section.content_json.body}</p>
          {section.content_json.cta ? (
            <a className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg border border-[#bceecf] px-6 py-3 font-semibold text-[#bceecf] transition hover:bg-[#bceecf] hover:text-primary" href={section.content_json.cta.href}>
              {section.content_json.cta.label}
            </a>
          ) : null}
        </div>
        <div className="hidden lg:block">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            <Image src={imageUrl} alt={section.content_json.heading} fill className="object-cover opacity-80 mix-blend-luminosity" sizes="50vw" />
            <div className="absolute inset-0 bg-primary/40" />
            <div className="absolute inset-0 grid place-items-center">
              <ShieldCheck className="text-[#bceecf]/70" size={120} aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FounderProfile({ section }: SectionProps<FounderProfileSection>) {
  const imageUrl = section.content_json.image_url || fallbackImages.founder;

  return (
    <section className="bg-white py-24" id="about">
      <div className="section-shell grid gap-16 lg:grid-cols-2 lg:items-center">
        <div className="relative">
          <div className="relative min-h-[420px] overflow-hidden rounded-3xl border border-border bg-muted shadow-2xl">
            <Image
              src={imageUrl}
              alt={section.content_json.founder_name}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 40vw, 100vw"
            />
          </div>
          <div className="absolute right-8 top-8 rounded-xl border border-border bg-white/80 px-6 py-4 text-center shadow-lg backdrop-blur">
            <div className="font-serif text-xl font-semibold text-secondary">Chartered Accountant</div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Trusted advisor</div>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary">About the firm</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-primary md:text-5xl">
            Professional expertise, <span className="italic text-secondary">personal guidance.</span>
          </h2>
          <p className="mt-5 leading-8 text-muted-foreground">{section.content_json.bio}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {section.content_json.credentials.map((credential) => (
              <span className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium" key={credential}>
                {credential}
              </span>
            ))}
          </div>
          <div className="mt-8">
            <p className="font-serif text-2xl font-semibold text-primary">{section.content_json.founder_name}</p>
            <p className="mt-1 text-sm font-semibold uppercase tracking-[0.12em] text-secondary">{section.content_json.designation}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials({ section }: SectionProps<TestimonialsSection>) {
  return (
    <section className="bg-background py-24">
      <div className="section-shell">
        <h2 className="text-center font-serif text-3xl font-semibold text-primary md:text-5xl">{section.content_json.heading}</h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {section.content_json.testimonials.map((testimonial) => (
            <figure className="rounded-xl border border-border bg-white p-8" key={testimonial.name}>
              <blockquote className="leading-7 text-muted-foreground">&ldquo;{testimonial.quote}&rdquo;</blockquote>
              <figcaption className="mt-5 font-semibold text-primary">{testimonial.name}</figcaption>
              <p className="text-sm text-muted-foreground">{testimonial.role}</p>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ({ section }: SectionProps<FaqSection>) {
  return (
    <section className="bg-background py-24" id="faq">
      <div className="section-shell max-w-4xl">
        <h2 className="font-serif text-3xl font-semibold text-primary md:text-5xl">{section.content_json.heading}</h2>
        <div className="mt-8 divide-y divide-border rounded-xl border border-border bg-white">
          {section.content_json.items.map((item) => (
            <details className="group p-6" key={item.question}>
              <summary className="cursor-pointer list-none font-semibold text-primary">
                {item.question}
                <span className="float-right text-muted-foreground group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 leading-7 text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTABanner({ section }: SectionProps<CtaBannerSection>) {
  return (
    <section className="bg-background py-12">
      <div className="section-shell rounded-2xl bg-primary p-8 text-primary-foreground md:flex md:items-center md:justify-between md:gap-8">
        <div>
          <h2 className="font-serif text-3xl font-semibold text-white">{section.content_json.heading}</h2>
          <p className="mt-3 max-w-2xl opacity-85">{section.content_json.description}</p>
        </div>
        <div className="mt-6 md:mt-0">
          <SectionButton href={section.content_json.primary_cta.href} label={section.content_json.primary_cta.label} secondary />
        </div>
      </div>
    </section>
  );
}

function ContactForm({ section, page }: SectionProps<ContactFormSection>) {
  return (
    <section className="bg-background py-24" id="contact">
      <div className="section-shell overflow-hidden rounded-3xl border border-border bg-white shadow-2xl">
        <div className="grid lg:grid-cols-2">
          <div className="p-8 lg:p-14">
            <h2 className="font-serif text-3xl font-semibold text-primary md:text-5xl">{section.content_json.heading}</h2>
            <p className="mt-4 max-w-2xl leading-8 text-muted-foreground">{section.content_json.description}</p>
            <div className="mt-8">
              <LeadForm organizationSlug={page.organization_slug} pageSlug={page.page_slug} services={servicesForPage(page)} />
            </div>
          </div>
          <div className="flex flex-col justify-between bg-primary p-8 text-primary-foreground lg:p-14">
            <div>
              <h3 className="font-serif text-2xl font-semibold text-white">Office Details</h3>
              <div className="mt-8 grid gap-7 text-sm">
                {section.content_json.show_map ? (
                  <div className="flex gap-4">
                    <FileCheck2 className="text-[#bceecf]" size={22} aria-hidden="true" />
                    <div>
                      <div className="font-semibold text-white">Office</div>
                      <div className="mt-1 opacity-80">{page.contact.address}</div>
                    </div>
                  </div>
                ) : null}
                {section.content_json.show_phone ? (
                  <div className="flex gap-4">
                    <CalendarDays className="text-[#bceecf]" size={22} aria-hidden="true" />
                    <div>
                      <div className="font-semibold text-white">Call Us</div>
                      <a className="mt-1 block opacity-80" href={`tel:${page.contact.phone}`}>{page.contact.phone}</a>
                    </div>
                  </div>
                ) : null}
                {section.content_json.show_email ? (
                  <div className="flex gap-4">
                    <ReceiptIndianRupee className="text-[#bceecf]" size={22} aria-hidden="true" />
                    <div>
                      <div className="font-semibold text-white">Email</div>
                      <a className="mt-1 block opacity-80" href={`mailto:${page.contact.email}`}>{page.contact.email}</a>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            {section.content_json.show_whatsapp ? (
              <a className="mt-12 inline-flex min-h-12 items-center justify-center rounded-lg border border-[#bceecf] px-4 py-3 font-semibold text-[#bceecf] transition hover:bg-[#bceecf] hover:text-primary" href={page.contact.whatsapp}>
                Chat on WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function RichText({ section }: SectionProps<RichTextSection>) {
  const paragraphs = section.content_json.markdown
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <section className="bg-background py-24" id="how-we-work">
      <div className="section-shell">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-semibold text-primary md:text-5xl">{section.content_json.heading}</h2>
          <p className="mt-4 text-muted-foreground">A streamlined process to take the accounting weight off your shoulders.</p>
        </div>
        <div className="mx-auto grid max-w-4xl gap-4">
          {paragraphs.map((paragraph, index) => {
            const clean = paragraph.replace(/[#*_`]/g, "").replace(/^\d+\.\s*/, "");
            const [title, ...rest] = clean.split(" - ");
            return (
              <article className="flex gap-6 rounded-xl border border-border bg-white p-8" key={paragraph}>
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-secondary font-serif text-xl font-bold text-white">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-semibold text-primary">{title}</h3>
                  <p className="mt-2 leading-7 text-muted-foreground">{rest.join(" - ") || clean}</p>
                </div>
              </article>
            );
          })}
        </div>
        <div className="mt-12 text-center">
          <a className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-9 py-3 text-sm font-semibold uppercase tracking-[0.05em] text-white shadow-sm transition hover:shadow-lg" href="#contact">
            Start the Conversation
          </a>
        </div>
      </div>
    </section>
  );
}

function servicesForPage(page: PublicSitePage): string[] {
  const serviceSection = page.sections.find((section): section is ServiceGridSection => section.section_type === "service_grid");
  return serviceSection?.content_json.services.map((service) => service.title) ?? [];
}

export const sectionRegistry = {
  hero: Hero,
  trust_stats: TrustStats,
  service_grid: ServiceGrid,
  image_text: ImageText,
  founder_profile: FounderProfile,
  testimonials: Testimonials,
  faq: FAQ,
  cta_banner: CTABanner,
  contact_form: ContactForm,
  rich_text: RichText
};

export function SectionRenderer({ page }: { page: PublicSitePage }) {
  return (
    <>
      {page.sections
        .filter((section) => section.is_visible)
        .sort((a, b) => a.position - b.position)
        .map((section) => {
          switch (section.section_type) {
            case "hero":
              return <Hero key={section.id} section={section} page={page} />;
            case "trust_stats":
              return <TrustStats key={section.id} section={section} page={page} />;
            case "service_grid":
              return <ServiceGrid key={section.id} section={section} page={page} />;
            case "image_text":
              return <ImageText key={section.id} section={section} page={page} />;
            case "founder_profile":
              return <FounderProfile key={section.id} section={section} page={page} />;
            case "testimonials":
              return <Testimonials key={section.id} section={section} page={page} />;
            case "faq":
              return <FAQ key={section.id} section={section} page={page} />;
            case "cta_banner":
              return <CTABanner key={section.id} section={section} page={page} />;
            case "contact_form":
              return <ContactForm key={section.id} section={section} page={page} />;
            case "rich_text":
              return <RichText key={section.id} section={section} page={page} />;
          }
        })}
    </>
  );
}
