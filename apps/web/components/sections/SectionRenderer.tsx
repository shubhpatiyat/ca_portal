import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeIndianRupee,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Eye,
  FileCheck2,
  FileText,
  FolderLock,
  Headphones,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ReceiptIndianRupee,
  ShieldCheck,
  TrendingUp,
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
  CalendarDays,
  Eye,
  UsersRound,
  FileCheck2
};

function SectionButton({
  href,
  label,
  secondary = false,
  light = false
}: {
  href: string;
  label: string;
  secondary?: boolean;
  light?: boolean;
}) {
  const classes = secondary
    ? `inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-bold transition hover:-translate-y-0.5 ${
        light
          ? "border-white/25 bg-white/5 text-white hover:bg-white/10"
          : "border-[#d8e2ec] bg-white text-[#0b1f33] hover:border-[#0e7cff] hover:text-[#0e7cff]"
      }`
    : "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#0e7cff] px-6 py-3 text-sm font-extrabold text-white shadow-[0_10px_30px_rgba(14,124,255,0.25)] transition hover:-translate-y-0.5 hover:bg-[#0872ec]";

  const content = (
    <>
      {label}
      {secondary ? <ChevronRight size={16} aria-hidden="true" /> : <ArrowUpRight size={16} aria-hidden="true" />}
    </>
  );

  if (href.startsWith("/")) {
    return <Link className={classes} href={href}>{content}</Link>;
  }
  return <a className={classes} href={href}>{content}</a>;
}

function AccountsDashboard() {
  const metrics = [
    { label: "Every invoice", value: "Scheduled", icon: FileText, blue: false },
    { label: "Every payment", value: "Tracked", icon: CircleDollarSign, blue: false },
    { label: "Every report", value: "Visible", icon: BarChart3, blue: false },
    { label: "Direct line", value: "Manager", icon: Headphones, blue: true }
  ];

  return (
    <div className="public-ring public-reveal relative rounded-[30px] border border-[#d8e2ec] bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4 border-b border-[#d8e2ec] px-1 pb-4">
        <div>
          <p className="text-sm font-bold text-[#0b1f33]">Books on schedule</p>
          <p className="mt-1 text-xs text-[#516173]">A clear view of every moving part</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#059669]/10 px-3 py-1.5 text-xs font-bold text-[#059669]">
          <CheckCircle2 size={14} aria-hidden="true" />
          On track
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {metrics.map(({ label, value, icon: Icon, blue }) => (
          <div
            className={`min-h-32 rounded-[18px] border p-4 ${
              blue ? "border-[#0b1f33] bg-[#0b1f33] text-white" : "border-[#d8e2ec] bg-[#f7fafc] text-[#0b1f33]"
            }`}
            key={label}
          >
            <Icon className={blue ? "text-[#8bc5ff]" : "text-[#0e7cff]"} size={20} aria-hidden="true" />
            <p className={`mt-5 text-xs font-semibold ${blue ? "text-white/65" : "text-[#516173]"}`}>{label}</p>
            <p className="mt-1 text-lg font-extrabold sm:text-xl">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#eef5fb] px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#516173]">
          <TrendingUp className="text-[#0e7cff]" size={16} aria-hidden="true" />
          Monthly close progress
        </div>
        <span className="text-sm font-extrabold text-[#0b1f33]">92%</span>
      </div>
    </div>
  );
}

function Hero({ section }: SectionProps<HeroSection>) {
  const content = section.content_json;

  return (
    <section className="public-grid-pattern relative bg-[radial-gradient(circle_at_70%_45%,#eef5fb_0%,#f7fafc_52%,#f7fafc_100%)] pb-20 pt-32 sm:pb-24 sm:pt-40 lg:pb-28 lg:pt-44" id="home">
      <div className="section-shell grid items-center gap-14 lg:grid-cols-[1.03fr_0.97fr] lg:gap-16">
        <div className="public-reveal">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#0e7cff]/20 bg-white px-4 py-2 text-xs font-bold text-[#0e7cff] shadow-sm">
            <ShieldCheck size={15} aria-hidden="true" />
            {content.eyebrow}
          </p>
          <h1 className="mt-6 max-w-2xl text-4xl font-black leading-[1.02] tracking-[-0.055em] text-[#0b1f33] sm:text-5xl lg:text-[4rem]">
            {content.title}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-[#516173] sm:text-lg">{content.description}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <SectionButton href={content.primary_cta.href} label={content.primary_cta.label} />
            {content.secondary_cta ? (
              <SectionButton href={content.secondary_cta.href} label={content.secondary_cta.label} secondary />
            ) : null}
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-[#516173]">
            {["Secure onboarding", "Transparent pricing", "Dedicated support"].map((item) => (
              <span className="inline-flex items-center gap-2" key={item}>
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[#0e7cff]/10 text-[#0e7cff]">
                  <Check size={12} strokeWidth={3} />
                </span>
                {item}
              </span>
            ))}
          </div>
        </div>
        <AccountsDashboard />
      </div>
    </section>
  );
}

function TrustStats({ section }: SectionProps<TrustStatsSection>) {
  return (
    <section className="border-y border-[#d8e2ec] bg-white py-10">
      <div className="section-shell">
        <h2 className="sr-only">{section.content_json.heading}</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {section.content_json.stats.map((stat) => (
            <div className="text-center sm:border-r sm:border-[#d8e2ec] sm:last:border-0" key={stat.label}>
              <strong className="block text-3xl font-black tracking-[-0.04em] text-[#0b1f33]">{stat.value}</strong>
              <span className="mt-2 block text-sm text-[#516173]">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceGrid({ section }: SectionProps<ServiceGridSection>) {
  const colors = [
    "bg-[#0e7cff]/10 text-[#0e7cff]",
    "bg-[#059669]/10 text-[#059669]",
    "bg-violet-500/10 text-violet-600",
    "bg-amber-500/10 text-amber-600"
  ];

  return (
    <section className="bg-[#f7fafc] py-20 sm:py-24" id="services">
      <div className="section-shell">
        <div className="mx-auto max-w-3xl text-center">
          <p className="public-eyebrow">Value Propositions</p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.045em] text-[#0b1f33] sm:text-5xl">{section.content_json.heading}</h2>
          {section.content_json.subheading ? (
            <p className="mx-auto mt-5 max-w-2xl leading-7 text-[#516173]">{section.content_json.subheading}</p>
          ) : null}
        </div>
        <div className={`mt-12 grid gap-4 ${section.variant === "two_columns" ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
          {section.content_json.services.map((service, index) => {
            const Icon = iconRegistry[service.icon as keyof typeof iconRegistry] ?? FileCheck2;
            return (
              <article
                className="group rounded-[24px] border border-[#d8e2ec] bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-[#0e7cff]/40 hover:shadow-[0_20px_50px_rgba(11,31,51,0.08)] sm:p-8"
                key={service.title}
              >
                <div className={`grid h-12 w-12 place-items-center rounded-2xl ${colors[index % colors.length]}`}>
                  <Icon size={22} aria-hidden="true" />
                </div>
                <h3 className="mt-6 text-xl font-extrabold tracking-[-0.025em] text-[#0b1f33]">{service.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#516173]">{service.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AboutSection({ section }: { section: ImageTextSection }) {
  return (
    <section className="bg-white py-20 sm:py-24" id="about">
      <div className="section-shell grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-16">
        <div className="relative min-h-[360px] overflow-hidden rounded-[28px] bg-[#eef5fb] p-7 sm:min-h-[420px] sm:p-9">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#0e7cff]/10 blur-2xl" />
          <div className="relative flex h-full min-h-[300px] flex-col justify-between rounded-[22px] border border-[#d8e2ec] bg-white p-6 shadow-[0_22px_60px_rgba(11,31,51,0.08)] sm:min-h-[350px]">
            <div className="flex items-center justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#0e7cff] text-white">
                <BookOpenCheck size={23} aria-hidden="true" />
              </div>
              <span className="rounded-full bg-[#059669]/10 px-3 py-1.5 text-xs font-bold text-[#059669]">Built for MSMEs</span>
            </div>
            <blockquote className="text-2xl font-black leading-tight tracking-[-0.035em] text-[#0b1f33] sm:text-3xl">
              “Clear books create room for better decisions.”
            </blockquote>
            <div className="grid grid-cols-3 gap-2">
              {["Accuracy", "Clarity", "Rhythm"].map((label) => (
                <span className="rounded-xl bg-[#f7fafc] px-2 py-3 text-center text-xs font-bold text-[#516173]" key={label}>{label}</span>
              ))}
            </div>
          </div>
        </div>
        <div>
          <p className="public-eyebrow">{section.content_json.eyebrow ?? "About Us"}</p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.045em] text-[#0b1f33] sm:text-5xl">{section.content_json.heading}</h2>
          <p className="mt-6 text-base leading-8 text-[#516173]">{section.content_json.body}</p>
          {section.content_json.cta ? (
            <div className="mt-8">
              <SectionButton href={section.content_json.cta.href} label={section.content_json.cta.label} secondary />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function SecuritySection({ section }: { section: ImageTextSection }) {
  const safeguards = [
    { icon: FolderLock, title: "Controlled storage", body: "Financial records stay within managed document workflows." },
    { icon: LockKeyhole, title: "Access controls", body: "Only authorized team members access client information." },
    { icon: FileCheck2, title: "NDA commitment", body: "Confidentiality is established before client data is handled." },
    { icon: ShieldCheck, title: "Secure processes", body: "Security is built into the day-to-day operating rhythm." }
  ];

  return (
    <section className="bg-[#0b1f33] py-20 text-white sm:py-24" id="security">
      <div className="section-shell grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-16">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#8bc5ff]">
            {section.content_json.eyebrow ?? "Data Security & Confidentiality"}
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.045em] sm:text-5xl">{section.content_json.heading}</h2>
          <p className="mt-6 leading-8 text-white/70">{section.content_json.body}</p>
          {section.content_json.cta ? (
            <div className="mt-8">
              <SectionButton href={section.content_json.cta.href} label={section.content_json.cta.label} secondary light />
            </div>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {safeguards.map(({ icon: Icon, title, body }) => (
            <article className="rounded-[22px] border border-white/10 bg-white/[0.055] p-6" key={title}>
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0e7cff]/20 text-[#8bc5ff]">
                <Icon size={21} aria-hidden="true" />
              </div>
              <h3 className="mt-5 font-extrabold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/60">{body}</p>
            </article>
          ))}
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
  return <AboutSection section={section} />;
}

function FounderProfile({ section }: SectionProps<FounderProfileSection>) {
  return (
    <section className="bg-white py-20 sm:py-24" id="about">
      <div className="section-shell grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="rounded-[28px] bg-[#eef5fb] p-8 sm:p-12">
          <div className="grid aspect-square max-w-md place-items-center rounded-full border border-[#d8e2ec] bg-white text-center shadow-[0_20px_60px_rgba(11,31,51,0.08)]">
            <div>
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#0e7cff]/10 text-3xl font-black text-[#0e7cff]">
                {section.content_json.founder_name.slice(0, 1)}
              </span>
              <p className="mt-5 text-2xl font-extrabold text-[#0b1f33]">{section.content_json.founder_name}</p>
              <p className="mt-2 text-sm font-bold text-[#0e7cff]">{section.content_json.designation}</p>
            </div>
          </div>
        </div>
        <div>
          <p className="public-eyebrow">About the firm</p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.045em] text-[#0b1f33] sm:text-5xl">Professional expertise, personal guidance.</h2>
          <p className="mt-6 leading-8 text-[#516173]">{section.content_json.bio}</p>
          <div className="mt-7 flex flex-wrap gap-2">
            {section.content_json.credentials.map((credential) => (
              <span className="rounded-full border border-[#d8e2ec] bg-[#f7fafc] px-4 py-2 text-sm font-semibold text-[#516173]" key={credential}>
                {credential}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials({ section }: SectionProps<TestimonialsSection>) {
  return (
    <section className="bg-[#eef5fb] py-20 sm:py-24">
      <div className="section-shell">
        <p className="public-eyebrow text-center">Client Stories</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-center text-3xl font-black tracking-[-0.045em] text-[#0b1f33] sm:text-5xl">{section.content_json.heading}</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {section.content_json.testimonials.map((testimonial) => (
            <figure className="rounded-[24px] border border-[#d8e2ec] bg-white p-7" key={testimonial.name}>
              <blockquote className="leading-7 text-[#516173]">&ldquo;{testimonial.quote}&rdquo;</blockquote>
              <figcaption className="mt-6 font-extrabold text-[#0b1f33]">{testimonial.name}</figcaption>
              <p className="mt-1 text-sm text-[#516173]">{testimonial.role}</p>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ({ section }: SectionProps<FaqSection>) {
  return (
    <section className="bg-[#f7fafc] py-20 sm:py-24" id="faq">
      <div className="section-shell grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
        <div>
          <p className="public-eyebrow">FAQ</p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.045em] text-[#0b1f33] sm:text-5xl">{section.content_json.heading}</h2>
          <p className="mt-5 max-w-sm leading-7 text-[#516173]">Questions business owners ask before handing over their books.</p>
          <a className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-[#0e7cff]" href="#contact">
            Ask another question
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
        <div className="grid gap-3">
          {section.content_json.items.map((item) => (
            <details className="group rounded-[22px] border border-[#d8e2ec] bg-white p-5 open:shadow-[0_16px_45px_rgba(11,31,51,0.06)] sm:p-6" key={item.question}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-bold text-[#0b1f33]">
                <span>{item.question}</span>
                <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-[#0e7cff]/10 text-xl font-medium text-[#0e7cff] transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-4 max-w-2xl border-t border-[#d8e2ec] pt-4 text-sm leading-7 text-[#516173]">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTABanner({ section }: SectionProps<CtaBannerSection>) {
  return (
    <section className="bg-[#eef5fb] py-10">
      <div className="section-shell overflow-hidden rounded-[28px] bg-[#0e7cff] p-8 text-white shadow-[0_22px_60px_rgba(14,124,255,0.2)] sm:flex sm:items-center sm:justify-between sm:gap-10 sm:p-10">
        <div>
          <h2 className="text-2xl font-black tracking-[-0.035em] sm:text-3xl">{section.content_json.heading}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">{section.content_json.description}</p>
        </div>
        <a className="mt-6 inline-flex min-h-12 flex-none items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-extrabold text-[#0e7cff] transition hover:-translate-y-0.5 sm:mt-0" href={section.content_json.primary_cta.href}>
          {section.content_json.primary_cta.label}
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}

function ContactDetail({ icon: Icon, label, value, href }: { icon: typeof Mail; label: string; value: string; href?: string }) {
  const content = (
    <>
      <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-[#0e7cff]/10 text-[#0e7cff]">
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold text-[#516173]">{label}</span>
        <span className="mt-1 block break-words text-sm font-bold text-[#0b1f33]">{value}</span>
      </span>
    </>
  );
  return href ? (
    <a className="flex items-center gap-3 rounded-2xl border border-[#d8e2ec] bg-[#f7fafc] p-4 transition hover:border-[#0e7cff]/40" href={href}>{content}</a>
  ) : (
    <div className="flex items-center gap-3 rounded-2xl border border-[#d8e2ec] bg-[#f7fafc] p-4">{content}</div>
  );
}

function ContactForm({ section, page }: SectionProps<ContactFormSection>) {
  return (
    <section className="bg-white py-20 sm:py-24" id="contact">
      <div className="section-shell grid gap-10 lg:grid-cols-[1fr_500px] lg:items-start lg:gap-14">
        <div>
          <p className="public-eyebrow">Contact Us</p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-[#0b1f33] sm:text-5xl">{section.content_json.heading}</h2>
          <p className="mt-6 max-w-xl leading-8 text-[#516173]">{section.content_json.description}</p>
          <p className="mt-8 text-base font-extrabold text-[#0b1f33]">Get in touch:</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {section.content_json.show_email ? <ContactDetail icon={Mail} label="Email" value={page.contact.email} href={`mailto:${page.contact.email}`} /> : null}
            {section.content_json.show_phone ? <ContactDetail icon={Phone} label="Phone" value={page.contact.phone} href={`tel:${page.contact.phone}`} /> : null}
            {section.content_json.show_map ? <ContactDetail icon={MapPin} label="Office Address" value={page.contact.address} /> : null}
            {section.content_json.business_hours ? <ContactDetail icon={Clock3} label="Business Hours" value={section.content_json.business_hours} /> : null}
          </div>
          {section.content_json.show_whatsapp ? (
            <a className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#0e7cff]" href={page.contact.whatsapp}>
              Message us on WhatsApp
              <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          ) : null}
        </div>
        <div className="public-card-shadow rounded-[28px] border border-[#d8e2ec] bg-[#f7fafc] p-5 sm:p-6">
          <LeadForm organizationSlug={page.organization_slug} pageSlug={page.page_slug} />
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
    <section className="bg-[#eef5fb] py-20 sm:py-24" id="how-we-work">
      <div className="section-shell">
        <div className="mx-auto max-w-3xl text-center">
          <p className="public-eyebrow">How It Works</p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.045em] text-[#0b1f33] sm:text-5xl">{section.content_json.heading}</h2>
          <p className="mx-auto mt-5 max-w-2xl leading-7 text-[#516173]">A simple, secure transition from scattered accounts work to a steady monthly rhythm.</p>
        </div>
        <div className="relative mt-12 grid gap-3 lg:grid-cols-5">
          <div className="absolute left-[10%] right-[10%] top-6 hidden h-px bg-[#b9cde0] lg:block" aria-hidden="true" />
          {paragraphs.map((paragraph, index) => {
            const clean = paragraph.replace(/[#*_`]/g, "").replace(/^\d+\.\s*/, "");
            const [title, ...rest] = clean.split(" - ");
            return (
              <article className="relative rounded-[22px] border border-[#d8e2ec] bg-white p-6 lg:border-0 lg:bg-transparent lg:p-0 lg:text-center" key={`${paragraph}-${index}`}>
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-[#0e7cff] text-base font-black text-white shadow-[0_0_0_7px_#eef5fb] lg:mx-auto">
                  {index + 1}
                </div>
                <h3 className="mt-5 font-extrabold text-[#0b1f33]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#516173]">{rest.join(" - ") || clean}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PageIntro({ page }: { page: PublicSitePage }) {
  const headingByPage: Record<string, string> = {
    home: `Chartered Accountant in ${page.city}`,
    services: `Services built around your business`,
    about: `About ${page.firm_name}`,
    contact: `Let's talk about your accounts`
  };
  const descriptionByPage: Record<string, string> = {
    home: page.seo.description,
    services: `Accounting, compliance, tax and financial operations support for businesses in ${page.city}.`,
    about: `Learn how ${page.firm_name} approaches accurate, transparent and dependable accounts management.`,
    contact: `Get in touch with ${page.firm_name} to discuss your accounting and compliance requirements.`
  };

  return (
    <section className="public-grid-pattern border-b border-[#d8e2ec] bg-[#eef5fb] pb-16 pt-32 text-center sm:pb-20 sm:pt-40">
      <div className="section-shell">
        <p className="public-eyebrow">{page.page_title}</p>
        <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-black tracking-[-0.05em] text-[#0b1f33] sm:text-6xl">
          {headingByPage[page.page_slug] ?? page.page_title}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#516173]">
          {descriptionByPage[page.page_slug] ?? page.seo.description}
        </p>
      </div>
    </section>
  );
}

export function SectionRenderer({ page }: { page: PublicSitePage }) {
  const visibleSections = page.sections
    .filter((section) => section.is_visible)
    .sort((a, b) => a.position - b.position);
  const hasHero = visibleSections.some((section) => section.section_type === "hero");

  return (
    <>
      {!hasHero ? <PageIntro page={page} /> : null}
      {visibleSections.map((section) => {
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
