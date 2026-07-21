"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import type {
  ContactFormSection,
  CtaBannerSection,
  FaqSection,
  FounderProfileSection,
  HeroSection,
  ImageTextSection,
  PageSection,
  RichTextSection,
  ServiceGridSection,
  TestimonialsSection,
  TrustStatsSection
} from "@/types/site";
import { adminApi } from "@/lib/api/admin";
import { Button } from "@/components/ui/Button";

const labels: Record<PageSection["section_type"], string> = {
  hero: "Home Banner",
  trust_stats: "Trust Indicators",
  service_grid: "Services",
  image_text: "Image and Text",
  founder_profile: "About the Firm",
  testimonials: "Client Testimonials",
  faq: "Frequently Asked Questions",
  cta_banner: "Consultation Banner",
  contact_form: "Contact / Consultation",
  rich_text: "Helpful Article"
};

function sectionDisplayName(section: PageSection): string {
  return section.admin_label?.trim() || labels[section.section_type];
}

const sectionTips: Record<PageSection["section_type"], { goal: string; checks: string[] }> = {
  hero: {
    goal: "Make the offer clear in the first few seconds and point visitors to one primary action.",
    checks: ["Clear promise", "Primary CTA present", "Secondary CTA only if useful"]
  },
  trust_stats: {
    goal: "Show proof that makes a new visitor feel safer before contacting you.",
    checks: ["Use real numbers", "Keep labels short", "Avoid unverifiable claims"]
  },
  service_grid: {
    goal: "Help visitors quickly confirm that you handle the work they need.",
    checks: ["At least 3 services", "Plain service names", "Outcome-focused descriptions"]
  },
  image_text: {
    goal: "Explain one important reason to trust you, such as pain points, security, or process depth.",
    checks: ["One clear idea", "Short heading", "CTA only when it helps"]
  },
  founder_profile: {
    goal: "Give the page a real human anchor and make the firm feel accountable.",
    checks: ["Name and role", "Relevant experience", "Credentials added"]
  },
  testimonials: {
    goal: "Use client proof to reduce hesitation before the enquiry.",
    checks: ["Real client quote", "Name or role", "Specific result when possible"]
  },
  faq: {
    goal: "Answer objections that may stop someone from booking a call.",
    checks: ["Pricing question", "Document/security question", "Timeline/onboarding question"]
  },
  cta_banner: {
    goal: "Repeat the main action once the visitor understands your service.",
    checks: ["One CTA", "Low-friction wording", "Links to contact or booking"]
  },
  contact_form: {
    goal: "Make it easy for a qualified visitor to start a conversation.",
    checks: ["Simple description", "Phone/email visible", "WhatsApp if supported"]
  },
  rich_text: {
    goal: "Make the process feel predictable so onboarding does not feel risky.",
    checks: ["3-5 steps", "No jargon", "Clear next action"]
  }
};

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function ctaHasText(cta: { label: string; href: string } | null | undefined): boolean {
  return Boolean(cta && hasText(cta.label) && hasText(cta.href));
}

function sectionHasRequiredText(section: PageSection): boolean {
  if (section.section_type === "hero") {
    const content = section.content_json;
    return hasText(content.eyebrow) && hasText(content.title) && hasText(content.description) && ctaHasText(content.primary_cta);
  }
  if (section.section_type === "trust_stats") {
    const content = section.content_json;
    return hasText(content.heading) && content.stats.length > 0 && content.stats.every((stat) => hasText(stat.value) && hasText(stat.label));
  }
  if (section.section_type === "service_grid") {
    const content = section.content_json;
    return (
      hasText(content.heading) &&
      content.services.length > 0 &&
      content.services.every((service) => hasText(service.title) && hasText(service.description))
    );
  }
  if (section.section_type === "image_text") {
    const content = section.content_json;
    return hasText(content.heading) && hasText(content.body);
  }
  if (section.section_type === "founder_profile") {
    const content = section.content_json;
    return hasText(content.founder_name) && hasText(content.designation) && hasText(content.bio);
  }
  if (section.section_type === "testimonials") {
    const content = section.content_json;
    return (
      hasText(content.heading) &&
      content.testimonials.length > 0 &&
      content.testimonials.every((testimonial) => hasText(testimonial.name) && hasText(testimonial.role) && hasText(testimonial.quote))
    );
  }
  if (section.section_type === "faq") {
    const content = section.content_json;
    return hasText(content.heading) && content.items.length > 0 && content.items.every((item) => hasText(item.question) && hasText(item.answer));
  }
  if (section.section_type === "cta_banner") {
    const content = section.content_json;
    return hasText(content.heading) && hasText(content.description) && ctaHasText(content.primary_cta);
  }
  if (section.section_type === "contact_form") {
    const content = section.content_json;
    return hasText(content.heading) && hasText(content.description);
  }
  if (section.section_type === "rich_text") {
    const content = section.content_json;
    return hasText(content.heading) && hasText(content.markdown);
  }
  return true;
}

export function SectionEditor({ sectionId }: { sectionId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pageQuery = useQuery({ queryKey: ["admin-page", "home"], queryFn: adminApi.homePage, retry: false });
  const [sections, setSections] = useState<PageSection[]>([]);
  const [section, setSection] = useState<PageSection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!pageQuery.data) {
      return;
    }
    setSections(pageQuery.data.sections);
    setSection(pageQuery.data.sections.find((item) => item.id === sectionId) ?? null);
  }, [pageQuery.data, sectionId]);

  const title = useMemo(() => (section ? sectionDisplayName(section) : "Section"), [section]);

  function updateSection(nextSection: PageSection) {
    setSection(nextSection);
    setSections((current) => current.map((item) => (item.id === nextSection.id ? nextSection : item)));
  }

  function publishSection() {
    setError(null);
    startTransition(async () => {
      try {
        const nextSections = sections.map((item) => (item.id === section?.id ? section : item));
        await adminApi.updateDraft(nextSections);
        await adminApi.publish();
        await queryClient.invalidateQueries({ queryKey: ["admin-page", "home"] });
        router.push("/admin/website");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not publish this section.");
      }
    });
  }

  if (pageQuery.isLoading) {
    return <div className="rounded-lg border bg-card p-6 text-muted-foreground">Loading section content...</div>;
  }

  if (!section) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h1 className="font-serif text-2xl font-bold text-primary">Section not found</h1>
        <p className="mt-2 text-muted-foreground">Go back to My Website and choose a section from the current page outline.</p>
      </div>
    );
  }

  const tips = sectionTips[section.section_type];
  const canPersist = sectionHasRequiredText(section);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="font-serif text-3xl font-bold text-primary">Edit {title}</h1>
        <p className="mt-2 text-muted-foreground">Update client-facing content. Layout, styling and allowed fields stay controlled.</p>

        <div className="mt-6 grid gap-4">
          <TextField
            label="Section name in your workspace"
            value={section.admin_label ?? ""}
            onChange={(adminLabel) => updateSection({ ...section, admin_label: adminLabel.trim() ? adminLabel : undefined })}
          />
          <SectionFields section={section} onChange={updateSection} />
        </div>

        {error ? <p className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
        {!canPersist ? (
          <p className="mt-6 rounded-md border border-secondary/30 bg-secondary/10 p-3 text-sm font-medium text-primary">
            Fill the required text fields before saving or publishing.
          </p>
        ) : null}

        <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/website")}>
            Cancel
          </Button>
          <Button type="button" disabled={isPending || !canPersist} onClick={publishSection}>
            <Send size={16} /> {isPending ? "Publishing..." : "Publish Changes"}
          </Button>
        </div>
      </div>

      <aside className="self-start rounded-lg border bg-card p-5">
        <h2 className="font-semibold text-primary">What this section should do</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{tips.goal}</p>
        <div className="mt-5 grid gap-3">
          {tips.checks.map((check) => (
            <div className="rounded-md border bg-background p-3 text-sm font-medium text-primary" key={check}>
              {check}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  multiline = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      {multiline ? (
        <textarea className="min-h-28 rounded-md border px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className="min-h-11 rounded-md border px-3" value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function SectionFields({ section, onChange }: { section: PageSection; onChange: (section: PageSection) => void }) {
  if (section.section_type === "hero") {
    return <HeroFields section={section} onChange={onChange} />;
  }
  if (section.section_type === "trust_stats") {
    return <TrustStatsFields section={section} onChange={onChange} />;
  }
  if (section.section_type === "service_grid") {
    return <ServiceFields section={section} onChange={onChange} />;
  }
  if (section.section_type === "image_text") {
    return <ImageTextFields section={section} onChange={onChange} />;
  }
  if (section.section_type === "founder_profile") {
    return <FounderFields section={section} onChange={onChange} />;
  }
  if (section.section_type === "testimonials") {
    return <TestimonialsFields section={section} onChange={onChange} />;
  }
  if (section.section_type === "faq") {
    return <FaqFields section={section} onChange={onChange} />;
  }
  if (section.section_type === "cta_banner") {
    return <CtaBannerFields section={section} onChange={onChange} />;
  }
  if (section.section_type === "contact_form") {
    return <ContactFields section={section} onChange={onChange} />;
  }
  if (section.section_type === "rich_text") {
    return <RichTextFields section={section} onChange={onChange} />;
  }

  return (
    <div className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
      This section is visible in the outline. A tailored editor for this section type is not yet exposed in the MVP.
    </div>
  );
}

function TrustStatsFields({ section, onChange }: { section: TrustStatsSection; onChange: (section: PageSection) => void }) {
  const content = section.content_json;
  return (
    <>
      <TextField label="Section heading" value={content.heading} onChange={(heading) => onChange({ ...section, content_json: { ...content, heading } })} />
      {content.stats.map((stat, index) => (
        <div className="grid gap-3 rounded-md border bg-background p-4 md:grid-cols-2" key={index}>
          <TextField label={`Proof ${index + 1} value`} value={stat.value} onChange={(value) => {
            const stats = content.stats.map((item, itemIndex) => (itemIndex === index ? { ...item, value } : item));
            onChange({ ...section, content_json: { ...content, stats } });
          }} />
          <TextField label="Label" value={stat.label} onChange={(label) => {
            const stats = content.stats.map((item, itemIndex) => (itemIndex === index ? { ...item, label } : item));
            onChange({ ...section, content_json: { ...content, stats } });
          }} />
        </div>
      ))}
      {content.stats.length < 6 ? (
        <button
          className="w-fit rounded-md border px-3 py-2 text-sm font-semibold"
          type="button"
          onClick={() =>
            onChange({
              ...section,
              content_json: { ...content, stats: [...content.stats, { value: "10+", label: "Proof point" }] }
            })
          }
        >
          Add proof point
        </button>
      ) : null}
    </>
  );
}

function HeroFields({ section, onChange }: { section: HeroSection; onChange: (section: PageSection) => void }) {
  const content = section.content_json;
  return (
    <>
      <TextField label="Small label" value={content.eyebrow} onChange={(eyebrow) => onChange({ ...section, content_json: { ...content, eyebrow } })} />
      <TextField label="Heading" value={content.title} onChange={(title) => onChange({ ...section, content_json: { ...content, title } })} />
      <TextField label="Description" multiline value={content.description} onChange={(description) => onChange({ ...section, content_json: { ...content, description } })} />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Main button label" value={content.primary_cta.label} onChange={(label) => onChange({ ...section, content_json: { ...content, primary_cta: { ...content.primary_cta, label } } })} />
        <TextField label="Main button link" value={content.primary_cta.href} onChange={(href) => onChange({ ...section, content_json: { ...content, primary_cta: { ...content.primary_cta, href } } })} />
      </div>
    </>
  );
}

function ServiceFields({ section, onChange }: { section: ServiceGridSection; onChange: (section: PageSection) => void }) {
  const content = section.content_json;
  return (
    <>
      <TextField label="Heading" value={content.heading} onChange={(heading) => onChange({ ...section, content_json: { ...content, heading } })} />
      <TextField label="Subheading" multiline value={content.subheading ?? ""} onChange={(subheading) => onChange({ ...section, content_json: { ...content, subheading } })} />
      {content.services.map((service, index) => (
        <div className="grid gap-3 rounded-md border bg-background p-4" key={index}>
          <TextField label={`Service ${index + 1} name`} value={service.title} onChange={(title) => {
            const services = content.services.map((item, itemIndex) => (itemIndex === index ? { ...item, title } : item));
            onChange({ ...section, content_json: { ...content, services } });
          }} />
          <TextField label="Description" multiline value={service.description} onChange={(description) => {
            const services = content.services.map((item, itemIndex) => (itemIndex === index ? { ...item, description } : item));
            onChange({ ...section, content_json: { ...content, services } });
          }} />
        </div>
      ))}
      {content.services.length < 12 ? (
        <button
          className="w-fit rounded-md border px-3 py-2 text-sm font-semibold"
          type="button"
          onClick={() =>
            onChange({
              ...section,
              content_json: {
                ...content,
                services: [
                  ...content.services,
                  { title: "New service", description: "Describe the business problem this service solves.", icon: "FileCheck2" }
                ]
              }
            })
          }
        >
          Add service
        </button>
      ) : null}
    </>
  );
}

function ImageTextFields({ section, onChange }: { section: ImageTextSection; onChange: (section: PageSection) => void }) {
  const content = section.content_json;
  return (
    <>
      <TextField label="Small label" value={content.eyebrow ?? ""} onChange={(eyebrow) => onChange({ ...section, content_json: { ...content, eyebrow } })} />
      <TextField label="Heading" value={content.heading} onChange={(heading) => onChange({ ...section, content_json: { ...content, heading } })} />
      <TextField label="Body" multiline value={content.body} onChange={(body) => onChange({ ...section, content_json: { ...content, body } })} />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Button label" value={content.cta?.label ?? ""} onChange={(label) => onChange({ ...section, content_json: { ...content, cta: { label, href: content.cta?.href ?? "#contact" } } })} />
        <TextField label="Button link" value={content.cta?.href ?? ""} onChange={(href) => onChange({ ...section, content_json: { ...content, cta: { label: content.cta?.label ?? "Learn more", href } } })} />
      </div>
    </>
  );
}

function FounderFields({ section, onChange }: { section: FounderProfileSection; onChange: (section: PageSection) => void }) {
  const content = section.content_json;
  return (
    <>
      <TextField label="Founder name" value={content.founder_name} onChange={(founder_name) => onChange({ ...section, content_json: { ...content, founder_name } })} />
      <TextField label="Designation" value={content.designation} onChange={(designation) => onChange({ ...section, content_json: { ...content, designation } })} />
      <TextField label="Bio" multiline value={content.bio} onChange={(bio) => onChange({ ...section, content_json: { ...content, bio } })} />
    </>
  );
}

function FaqFields({ section, onChange }: { section: FaqSection; onChange: (section: PageSection) => void }) {
  const content = section.content_json;
  return (
    <>
      <TextField label="Heading" value={content.heading} onChange={(heading) => onChange({ ...section, content_json: { ...content, heading } })} />
      {content.items.map((item, index) => (
        <div className="grid gap-3 rounded-md border bg-background p-4" key={index}>
          <TextField label={`Question ${index + 1}`} value={item.question} onChange={(question) => {
            const items = content.items.map((current, itemIndex) => (itemIndex === index ? { ...current, question } : current));
            onChange({ ...section, content_json: { ...content, items } });
          }} />
          <TextField label="Answer" multiline value={item.answer} onChange={(answer) => {
            const items = content.items.map((current, itemIndex) => (itemIndex === index ? { ...current, answer } : current));
            onChange({ ...section, content_json: { ...content, items } });
          }} />
        </div>
      ))}
      {content.items.length < 20 ? (
        <button
          className="w-fit rounded-md border px-3 py-2 text-sm font-semibold"
          type="button"
          onClick={() =>
            onChange({
              ...section,
              content_json: {
                ...content,
                items: [...content.items, { question: "New question", answer: "Add a clear answer before publishing." }]
              }
            })
          }
        >
          Add question
        </button>
      ) : null}
    </>
  );
}

function TestimonialsFields({ section, onChange }: { section: TestimonialsSection; onChange: (section: PageSection) => void }) {
  const content = section.content_json;
  return (
    <>
      <TextField label="Heading" value={content.heading} onChange={(heading) => onChange({ ...section, content_json: { ...content, heading } })} />
      {content.testimonials.map((testimonial, index) => (
        <div className="grid gap-3 rounded-md border bg-background p-4" key={index}>
          <TextField label={`Client ${index + 1} name`} value={testimonial.name} onChange={(name) => {
            const testimonials = content.testimonials.map((item, itemIndex) => (itemIndex === index ? { ...item, name } : item));
            onChange({ ...section, content_json: { ...content, testimonials } });
          }} />
          <TextField label="Role or company" value={testimonial.role} onChange={(role) => {
            const testimonials = content.testimonials.map((item, itemIndex) => (itemIndex === index ? { ...item, role } : item));
            onChange({ ...section, content_json: { ...content, testimonials } });
          }} />
          <TextField label="Quote" multiline value={testimonial.quote} onChange={(quote) => {
            const testimonials = content.testimonials.map((item, itemIndex) => (itemIndex === index ? { ...item, quote } : item));
            onChange({ ...section, content_json: { ...content, testimonials } });
          }} />
        </div>
      ))}
      {content.testimonials.length < 9 ? (
        <button
          className="w-fit rounded-md border px-3 py-2 text-sm font-semibold"
          type="button"
          onClick={() =>
            onChange({
              ...section,
              content_json: {
                ...content,
                testimonials: [
                  ...content.testimonials,
                  { name: "Client Name", role: "Founder, Company", quote: "Add a specific quote before publishing." }
                ]
              }
            })
          }
        >
          Add testimonial
        </button>
      ) : null}
    </>
  );
}

function CtaBannerFields({ section, onChange }: { section: CtaBannerSection; onChange: (section: PageSection) => void }) {
  const content = section.content_json;
  return (
    <>
      <TextField label="Heading" value={content.heading} onChange={(heading) => onChange({ ...section, content_json: { ...content, heading } })} />
      <TextField label="Description" multiline value={content.description} onChange={(description) => onChange({ ...section, content_json: { ...content, description } })} />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Button label" value={content.primary_cta.label} onChange={(label) => onChange({ ...section, content_json: { ...content, primary_cta: { ...content.primary_cta, label } } })} />
        <TextField label="Button link" value={content.primary_cta.href} onChange={(href) => onChange({ ...section, content_json: { ...content, primary_cta: { ...content.primary_cta, href } } })} />
      </div>
    </>
  );
}

function ContactFields({ section, onChange }: { section: ContactFormSection; onChange: (section: PageSection) => void }) {
  const content = section.content_json;
  return (
    <>
      <TextField label="Heading" value={content.heading} onChange={(heading) => onChange({ ...section, content_json: { ...content, heading } })} />
      <TextField label="Description" multiline value={content.description} onChange={(description) => onChange({ ...section, content_json: { ...content, description } })} />
    </>
  );
}

function RichTextFields({ section, onChange }: { section: RichTextSection; onChange: (section: PageSection) => void }) {
  const content = section.content_json;
  return (
    <>
      <TextField label="Heading" value={content.heading} onChange={(heading) => onChange({ ...section, content_json: { ...content, heading } })} />
      <TextField label="Steps or article text" multiline value={content.markdown} onChange={(markdown) => onChange({ ...section, content_json: { ...content, markdown } })} />
    </>
  );
}
