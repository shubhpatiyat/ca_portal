"use client";

import { useEffect, useState, useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import type { FaqSection, PageSection, ServiceGridSection, TestimonialsSection } from "@/types/site";
import { adminApi } from "@/lib/api/admin";
import { randomId } from "@/lib/random-id";

export function ServicesFromApi() {
  const pageQuery = useQuery({ queryKey: ["admin-page", "home"], queryFn: adminApi.homePage, retry: false });
  const serviceSection = pageQuery.data?.sections.find((section): section is ServiceGridSection => section.section_type === "service_grid");

  return (
    <div className="grid gap-6">
      <h1 className="font-serif text-3xl font-bold text-primary">Services</h1>
      {pageQuery.isLoading ? <p className="text-muted-foreground">Loading services...</p> : null}
      {pageQuery.isError ? <p className="text-destructive">Could not load services. Please refresh and try again.</p> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {serviceSection?.content_json.services.map((service) => (
          <div className="rounded-lg border bg-card p-5" key={service.title}>
            <h2 className="font-semibold text-primary">{service.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{service.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FaqsFromApi() {
  const queryClient = useQueryClient();
  const pageQuery = useQuery({ queryKey: ["admin-page", "home"], queryFn: adminApi.homePage, retry: false });
  const faqSection = pageQuery.data?.sections.find((section): section is FaqSection => section.section_type === "faq");
  const [heading, setHeading] = useState("Frequently asked questions");
  const [isVisible, setIsVisible] = useState(true);
  const [items, setItems] = useState<Array<{ question: string; answer: string }>>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!faqSection) {
      return;
    }
    setHeading(faqSection.content_json.heading);
    setIsVisible(faqSection.is_visible);
    setItems(faqSection.content_json.items);
  }, [faqSection]);

  function saveFaqs() {
    if (!pageQuery.data) {
      return;
    }
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await adminApi.updateDraft(upsertFaqSection(pageQuery.data.sections, faqSection, heading, items, isVisible));
        await queryClient.invalidateQueries({ queryKey: ["admin-page", "home"] });
        setMessage("FAQs saved.");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not save FAQs.");
      }
    });
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-primary">FAQs</h1>
        <p className="mt-2 text-muted-foreground">Add, edit, hide or remove public questions from one place.</p>
      </div>
      {pageQuery.isLoading ? <p className="text-muted-foreground">Loading FAQs...</p> : null}
      {pageQuery.isError ? <p className="text-destructive">Could not load FAQs. Please refresh and try again.</p> : null}
      <div className="rounded-lg border bg-card p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <label className="grid gap-2 text-sm font-medium">
            Section heading
            <input className="min-h-11 rounded-md border bg-background px-3" value={heading} onChange={(event) => setHeading(event.target.value)} />
          </label>
          <label className="flex min-h-11 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium">
            <input checked={isVisible} type="checkbox" onChange={(event) => setIsVisible(event.target.checked)} />
            Show on website
          </label>
        </div>
        <div className="mt-5 grid gap-4">
          {items.map((item, index) => (
            <div className="grid gap-3 rounded-md border bg-background p-4" key={index}>
              <label className="grid gap-2 text-sm font-medium">
                Question
                <input
                  className="min-h-11 rounded-md border px-3"
                  value={item.question}
                  onChange={(event) =>
                    setItems((current) => current.map((faq, itemIndex) => (itemIndex === index ? { ...faq, question: event.target.value } : faq)))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Answer
                <textarea
                  className="min-h-28 rounded-md border px-3 py-2"
                  value={item.answer}
                  onChange={(event) =>
                    setItems((current) => current.map((faq, itemIndex) => (itemIndex === index ? { ...faq, answer: event.target.value } : faq)))
                  }
                />
              </label>
              <button className="w-fit rounded-md border px-3 py-2 text-sm font-semibold text-destructive" type="button" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                Delete question
              </button>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="rounded-md border px-4 py-2 text-sm font-semibold" type="button" onClick={() => setItems((current) => [...current, { question: "", answer: "" }])}>
            Add question
          </button>
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60" type="button" disabled={isPending} onClick={saveFaqs}>
            {isPending ? "Saving..." : "Save FAQs"}
          </button>
        </div>
        {message ? <p className="mt-4 text-sm font-medium text-accent">{message}</p> : null}
        {error ? <p className="mt-4 text-sm font-medium text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}

export function ReviewsFromApi() {
  const queryClient = useQueryClient();
  const pageQuery = useQuery({ queryKey: ["admin-page", "home"], queryFn: adminApi.homePage, retry: false });
  const testimonialsSection = pageQuery.data?.sections.find((section): section is TestimonialsSection => section.section_type === "testimonials");
  const [heading, setHeading] = useState("Client reviews");
  const [isVisible, setIsVisible] = useState(true);
  const [testimonials, setTestimonials] = useState<Array<{ name: string; role: string; quote: string }>>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!testimonialsSection) {
      return;
    }
    setHeading(testimonialsSection.content_json.heading);
    setIsVisible(testimonialsSection.is_visible);
    setTestimonials(testimonialsSection.content_json.testimonials);
  }, [testimonialsSection]);

  function saveReviews() {
    if (!pageQuery.data) {
      return;
    }
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await adminApi.updateDraft(upsertTestimonialsSection(pageQuery.data.sections, testimonialsSection, heading, testimonials, isVisible));
        await queryClient.invalidateQueries({ queryKey: ["admin-page", "home"] });
        setMessage("Reviews saved.");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not save reviews.");
      }
    });
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-primary">Client Reviews</h1>
        <p className="mt-2 text-muted-foreground">Add, edit, hide or remove testimonials shown on the public website.</p>
      </div>
      {pageQuery.isLoading ? <p className="text-muted-foreground">Loading reviews...</p> : null}
      {pageQuery.isError ? <p className="text-destructive">Could not load reviews. Please refresh and try again.</p> : null}
      <div className="rounded-lg border bg-card p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <label className="grid gap-2 text-sm font-medium">
            Section heading
            <input className="min-h-11 rounded-md border bg-background px-3" value={heading} onChange={(event) => setHeading(event.target.value)} />
          </label>
          <label className="flex min-h-11 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium">
            <input checked={isVisible} type="checkbox" onChange={(event) => setIsVisible(event.target.checked)} />
            Show on website
          </label>
        </div>
        <div className="mt-5 grid gap-4">
          {testimonials.map((testimonial, index) => (
            <div className="grid gap-3 rounded-md border bg-background p-4" key={index}>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium">
                  Client name
                  <input
                    className="min-h-11 rounded-md border px-3"
                    value={testimonial.name}
                    onChange={(event) =>
                      setTestimonials((current) => current.map((review, itemIndex) => (itemIndex === index ? { ...review, name: event.target.value } : review)))
                    }
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Role or company
                  <input
                    className="min-h-11 rounded-md border px-3"
                    value={testimonial.role}
                    onChange={(event) =>
                      setTestimonials((current) => current.map((review, itemIndex) => (itemIndex === index ? { ...review, role: event.target.value } : review)))
                    }
                  />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-medium">
                Review
                <textarea
                  className="min-h-28 rounded-md border px-3 py-2"
                  value={testimonial.quote}
                  onChange={(event) =>
                    setTestimonials((current) => current.map((review, itemIndex) => (itemIndex === index ? { ...review, quote: event.target.value } : review)))
                  }
                />
              </label>
              <button className="w-fit rounded-md border px-3 py-2 text-sm font-semibold text-destructive" type="button" onClick={() => setTestimonials((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                Delete review
              </button>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="rounded-md border px-4 py-2 text-sm font-semibold" type="button" onClick={() => setTestimonials((current) => [...current, { name: "", role: "", quote: "" }])}>
            Add review
          </button>
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60" type="button" disabled={isPending} onClick={saveReviews}>
            {isPending ? "Saving..." : "Save Reviews"}
          </button>
        </div>
        {message ? <p className="mt-4 text-sm font-medium text-accent">{message}</p> : null}
        {error ? <p className="mt-4 text-sm font-medium text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}

function upsertFaqSection(
  sections: PageSection[],
  existing: FaqSection | undefined,
  heading: string,
  items: Array<{ question: string; answer: string }>,
  isVisible: boolean
): PageSection[] {
  const cleanItems = items.filter((item) => item.question.trim() && item.answer.trim());
  const nextSections: PageSection[] = sections.filter((section) => section.section_type !== "faq");
  if (cleanItems.length) {
    nextSections.push({
      id: existing?.id ?? randomId(),
      admin_label: existing?.admin_label ?? "FAQs",
      section_type: "faq",
      position: nextSections.length + 1,
      is_visible: isVisible,
      variant: "accordion",
      content_json: {
        heading: heading.trim() || "Frequently asked questions",
        items: cleanItems
      }
    });
  }
  return renumberSections(nextSections);
}

function upsertTestimonialsSection(
  sections: PageSection[],
  existing: TestimonialsSection | undefined,
  heading: string,
  testimonials: Array<{ name: string; role: string; quote: string }>,
  isVisible: boolean
): PageSection[] {
  const cleanTestimonials = testimonials.filter((testimonial) => testimonial.name.trim() && testimonial.quote.trim());
  const nextSections: PageSection[] = sections.filter((section) => section.section_type !== "testimonials");
  if (cleanTestimonials.length) {
    nextSections.push({
      id: existing?.id ?? randomId(),
      admin_label: existing?.admin_label ?? "Client reviews",
      section_type: "testimonials",
      position: nextSections.length + 1,
      is_visible: isVisible,
      variant: "cards",
      content_json: {
        heading: heading.trim() || "Client reviews",
        testimonials: cleanTestimonials.map((testimonial) => ({ ...testimonial, role: testimonial.role.trim() || "Client" }))
      }
    });
  }
  return renumberSections(nextSections);
}

function renumberSections(sections: PageSection[]): PageSection[] {
  return sections.map((section, index) => ({ ...section, position: index + 1 }));
}

export function ContactDetailsFromApi() {
  const queryClient = useQueryClient();
  const pageQuery = useQuery({ queryKey: ["admin-page", "home"], queryFn: adminApi.homePage, retry: false });
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!pageQuery.data) {
      return;
    }
    setPhone(pageQuery.data.contact.phone);
    setWhatsapp(pageQuery.data.contact.whatsapp);
    setEmail(pageQuery.data.contact.email);
    setAddress(pageQuery.data.contact.address);
  }, [pageQuery.data]);

  const canSave = phone.trim().length >= 8 && whatsapp.trim().length >= 8 && email.trim().includes("@") && address.trim().length >= 8;

  function saveContactDetails() {
    if (!canSave) {
      setError("Fill phone, WhatsApp, email and office address before saving.");
      return;
    }
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await adminApi.updateOrganization({
          contact_phone: phone,
          contact_whatsapp: whatsapp,
          contact_email: email,
          contact_address: address
        });
        await queryClient.invalidateQueries({ queryKey: ["admin-page", "home"] });
        await queryClient.invalidateQueries({ queryKey: ["admin-me"] });
        setMessage("Contact details saved.");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not save contact details.");
      }
    });
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-primary">Contact Details</h1>
        <p className="mt-2 text-muted-foreground">Update the phone, WhatsApp, email and office address shown on the public website.</p>
      </div>
      {pageQuery.isLoading ? <p className="mt-3 text-muted-foreground">Loading contact details...</p> : null}
      {pageQuery.isError ? <p className="mt-3 text-destructive">Could not load contact details. Please refresh and try again.</p> : null}
      <div className="rounded-lg border bg-card p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <ContactField label="Phone" value={phone} onChange={setPhone} placeholder="+91 90000 12345" />
          <ContactField label="WhatsApp" value={whatsapp} onChange={setWhatsapp} placeholder="+91 90000 12345" />
          <ContactField label="Email" value={email} onChange={setEmail} placeholder="office@example.in" type="email" />
          <ContactField label="Office address" value={address} onChange={setAddress} placeholder="Your office address" />
        </div>
        <div className="mt-6 flex justify-end">
          <button
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            disabled={isPending || !canSave}
            onClick={saveContactDetails}
            type="button"
          >
            {isPending ? "Saving..." : "Save Contact Details"}
          </button>
        </div>
        {message ? <p className="mt-4 text-sm font-medium text-accent">{message}</p> : null}
        {error ? <p className="mt-4 text-sm font-medium text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}

function ContactField({
  label,
  value,
  onChange,
  placeholder,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        className="min-h-11 rounded-md border bg-background px-3"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}
