"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  GripVertical,
  Lightbulb,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { PageSection } from "@/types/site";
import { adminApi } from "@/lib/api/admin";
import { Button } from "@/components/ui/Button";

type SectionImportance = "Required" | "Recommended" | "Optional";

type SectionGuide = {
  label: string;
  purpose: string;
  importance: SectionImportance;
};

const sectionGuides: Record<PageSection["section_type"], SectionGuide> = {
  hero: {
    label: "Hero",
    purpose: "Make the first promise clear and give visitors one obvious action.",
    importance: "Required"
  },
  trust_stats: {
    label: "Trust Proof",
    purpose: "Show proof such as client count, reviews, savings, filings, or years of experience.",
    importance: "Recommended"
  },
  service_grid: {
    label: "Services",
    purpose: "List the actual work you handle so visitors can quickly self-qualify.",
    importance: "Required"
  },
  image_text: {
    label: "Story Block",
    purpose: "Explain a pain point, security promise, or important business reason to trust you.",
    importance: "Recommended"
  },
  founder_profile: {
    label: "Dedicated Expert",
    purpose: "Put a real person or firm story behind the service to build confidence.",
    importance: "Recommended"
  },
  testimonials: {
    label: "Testimonials",
    purpose: "Let customers or proof points reduce buyer hesitation before the call.",
    importance: "Recommended"
  },
  faq: {
    label: "FAQ",
    purpose: "Answer common objections about pricing, documents, onboarding, and timelines.",
    importance: "Recommended"
  },
  cta_banner: {
    label: "Final CTA",
    purpose: "Give visitors one more clear path to book a call after they understand the offer.",
    importance: "Required"
  },
  contact_form: {
    label: "Contact Form",
    purpose: "Capture leads and show phone, email, WhatsApp, and office details.",
    importance: "Required"
  },
  rich_text: {
    label: "How It Works",
    purpose: "Make your process feel simple, safe, and predictable.",
    importance: "Recommended"
  }
};

const requiredTypes: PageSection["section_type"][] = ["hero", "service_grid", "contact_form", "cta_banner"];
const recommendedTypes: PageSection["section_type"][] = ["trust_stats", "image_text", "rich_text"];
const dedicatedContentTypes: PageSection["section_type"][] = ["faq", "testimonials"];

function isDedicatedContentSection(section: PageSection) {
  return dedicatedContentTypes.includes(section.section_type);
}

function sectionStatus(section: PageSection): "Complete" | "Needs attention" | "Hidden" {
  if (!section.is_visible) {
    return "Hidden";
  }
  if (section.section_type === "hero") {
    return section.content_json.primary_cta.label && section.content_json.primary_cta.href ? "Complete" : "Needs attention";
  }
  if (section.section_type === "service_grid") {
    return section.content_json.services.length >= 3 ? "Complete" : "Needs attention";
  }
  return "Complete";
}

function hasVisibleType(sections: PageSection[], type: PageSection["section_type"]) {
  return sections.some((section) => section.section_type === type && section.is_visible);
}

function buildReadiness(sections: PageSection[]) {
  const requiredBasics = [
    {
      label: "Hero with a primary call to action",
      done: sections.some(
        (section) =>
          section.section_type === "hero" &&
          section.is_visible &&
          Boolean(section.content_json.primary_cta.label && section.content_json.primary_cta.href)
      )
    },
    {
      label: "At least three services listed",
      done: sections.some((section) => section.section_type === "service_grid" && section.is_visible && section.content_json.services.length >= 3)
    },
    {
      label: "Contact form is visible",
      done: hasVisibleType(sections, "contact_form")
    },
    {
      label: "Final call to action is visible",
      done: hasVisibleType(sections, "cta_banner")
    }
  ];

  const trustBoosters = [
    {
      label: "Trust proof is visible",
      done: hasVisibleType(sections, "trust_stats")
    },
    {
      label: "Process or onboarding steps explained",
      done: hasVisibleType(sections, "rich_text")
    },
    {
      label: "Security or confidentiality explained",
      done: sections.some(
        (section) =>
          section.section_type === "image_text" &&
          section.is_visible &&
          /security|secure|confidential|data|document/i.test(`${section.content_json.heading} ${section.content_json.body}`)
      )
    }
  ];
  const checks = [...requiredBasics, ...trustBoosters];
  const complete = checks.filter((check) => check.done).length;
  return {
    requiredBasics,
    trustBoosters,
    checks,
    requiredComplete: requiredBasics.filter((check) => check.done).length,
    trustComplete: trustBoosters.filter((check) => check.done).length,
    score: Math.round((complete / checks.length) * 100)
  };
}

const suggestedSections: Array<{
  key: string;
  title: string;
  description: string;
  section: () => PageSection;
}> = [
  {
    key: "trust",
    title: "Trust proof",
    description: "Add numbers or proof that reduce hesitation.",
    section: () => ({
      id: crypto.randomUUID(),
      section_type: "trust_stats",
      position: 1,
      is_visible: true,
      variant: "cards",
      content_json: {
        heading: "Why businesses trust us",
        stats: [
          { value: "40+", label: "SMEs supported" },
          { value: "24 hrs", label: "Typical response time" },
          { value: "100%", label: "Owner-reviewed work" }
        ]
      }
    })
  },
  {
    key: "pain",
    title: "Client concerns we solve",
    description: "Show visitors the tax, compliance, or bookkeeping problems you help fix.",
    section: () => ({
      id: crypto.randomUUID(),
      section_type: "image_text",
      position: 1,
      is_visible: true,
      variant: "image_right",
      content_json: {
        eyebrow: "When finance work starts slipping",
        heading: "We help stabilize the back office before it slows growth.",
        body:
          "Books behind schedule. Compliance deadlines approaching. Documents scattered across email and WhatsApp. Founders should not have to chase basic financial clarity while running the business.",
        cta: { label: "Talk to us", href: "#contact" }
      }
    })
  },
  {
    key: "process",
    title: "How it works",
    description: "Make onboarding feel simple and safe.",
    section: () => ({
      id: crypto.randomUUID(),
      section_type: "rich_text",
      position: 1,
      is_visible: true,
      variant: "article",
      content_json: {
        heading: "How we work",
        markdown:
          "1. Free consultation - We understand your current setup and pain points.\n2. Custom proposal - You get a clear scope and transparent pricing.\n3. Secure onboarding - Documents, access, and responsibilities are set up safely.\n4. Transition and cleanup - We reconcile data and set monthly workflows.\n5. Ongoing management - You get reporting, compliance reminders, and support."
      }
    })
  },
  {
    key: "security",
    title: "Security block",
    description: "Reassure buyers before they share sensitive financial data.",
    section: () => ({
      id: crypto.randomUUID(),
      section_type: "image_text",
      position: 1,
      is_visible: true,
      variant: "image_left",
      content_json: {
        eyebrow: "Data security",
        heading: "Sensitive financial data is handled with controlled access.",
        body:
          "Client documents, credentials, and financial records need careful handling. Use this section to explain your access controls, document process, review trails, and confidentiality practices.",
        cta: { label: "Read security policy", href: "/security" }
      }
    })
  },
  {
    key: "final-cta",
    title: "Final CTA",
    description: "Give visitors one last clear action near the bottom.",
    section: () => ({
      id: crypto.randomUUID(),
      section_type: "cta_banner",
      position: 1,
      is_visible: true,
      variant: "solid",
      content_json: {
        heading: "Ready to clean up your finance operations?",
        description: "Start with a short consultation and leave with a clearer next step.",
        primary_cta: { label: "Book a free call", href: "#contact" }
      }
    })
  }
];

function serviceText(sections: PageSection[]): string {
  const serviceSection = sections.find((section) => section.section_type === "service_grid");
  if (!serviceSection) {
    return "";
  }
  return serviceSection.content_json.services.map((service) => service.title).join(" ").toLowerCase();
}

function contextualSuggestions(sections: PageSection[]): typeof suggestedSections {
  const services = serviceText(sections);
  const suggestions: typeof suggestedSections = [];

  if (/registration|startup|incorporation|company|llp|opc/.test(services)) {
    suggestions.push({
      key: "startup-process",
      title: "Incorporation process",
      description: "Helpful for startup or business-registration focused firms.",
      section: () => ({
        id: crypto.randomUUID(),
        section_type: "rich_text",
        position: 1,
        is_visible: true,
        variant: "article",
        content_json: {
          heading: "Company registration process",
          markdown:
            "1. Consultation - We understand the business structure and founder requirements.\n2. Name and documents - We prepare the required identity, address and incorporation documents.\n3. Filing - We submit forms and coordinate clarifications.\n4. Post-registration setup - We help with PAN, TAN, GST and compliance basics."
        }
      })
    });
  }

  if (/tax|notice|itr|income/.test(services)) {
    suggestions.push({
      key: "tax-notice",
      title: "Tax notice support",
      description: "Useful if clients often arrive with notices or filing doubts.",
      section: () => ({
        id: crypto.randomUUID(),
        section_type: "image_text",
        position: 1,
        is_visible: true,
        variant: "image_right",
        content_json: {
          eyebrow: "Tax notices",
          heading: "Received a notice or missed a filing deadline?",
          body: "We review the notice, explain the risk in plain language, collect supporting documents and prepare the response or filing plan.",
          cta: { label: "Get help", href: "#contact" }
        }
      })
    });
  }

  suggestions.push({
    key: "office-location",
    title: "Office location",
    description: "Good for local firms where walk-ins and city trust matter.",
    section: () => ({
      id: crypto.randomUUID(),
      section_type: "image_text",
      position: 1,
      is_visible: true,
      variant: "image_left",
      content_json: {
        eyebrow: "Local office",
        heading: "Visit or contact our office",
        body: "Add your office area, working hours and preferred appointment process so local clients know how to reach you.",
        cta: { label: "Book appointment", href: "#contact" }
      }
    })
  });

  return suggestions;
}

export function WebsiteEditor() {
  const queryClient = useQueryClient();
  const pageQuery = useQuery({ queryKey: ["admin-page", "home"], queryFn: adminApi.homePage, retry: false });
  const [sections, setSections] = useState<PageSection[]>([]);
  const [dirty, setDirty] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState("");
  const [showRecommendedConfirm, setShowRecommendedConfirm] = useState(false);
  const [sectionPendingRemovalId, setSectionPendingRemovalId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sortedSections = useMemo(() => [...sections].sort((a, b) => a.position - b.position), [sections]);
  const websiteSections = useMemo(() => sortedSections.filter((section) => !isDedicatedContentSection(section)), [sortedSections]);
  const dedicatedSections = useMemo(() => sortedSections.filter(isDedicatedContentSection), [sortedSections]);
  const sectionPendingRemoval = useMemo(
    () => sortedSections.find((section) => section.id === sectionPendingRemovalId) ?? null,
    [sectionPendingRemovalId, sortedSections]
  );
  const readiness = useMemo(() => buildReadiness(websiteSections), [websiteSections]);
  const missingRequired = requiredTypes.filter((type) => !hasVisibleType(websiteSections, type));
  const missingRecommended = recommendedTypes.filter((type) => !hasVisibleType(websiteSections, type));
  const visibleCount = websiteSections.filter((section) => section.is_visible).length;
  const allSuggestions = useMemo(() => [...contextualSuggestions(websiteSections), ...suggestedSections], [websiteSections]);
  const suggestedToShow = allSuggestions.filter((suggestion) => {
    if (suggestion.key === "startup-process") {
      return !websiteSections.some((section) => section.section_type === "rich_text" && /registration|incorporation/i.test(section.content_json.heading));
    }
    if (suggestion.key === "tax-notice") {
      return !websiteSections.some((section) => section.section_type === "image_text" && /notice/i.test(`${section.content_json.heading} ${section.content_json.body}`));
    }
    if (suggestion.key === "office-location") {
      return !websiteSections.some((section) => section.section_type === "image_text" && /office|location|visit/i.test(`${section.content_json.heading} ${section.content_json.body}`));
    }
    if (suggestion.key === "trust") {
      return !hasVisibleType(websiteSections, "trust_stats");
    }
    if (suggestion.key === "process") {
      return !hasVisibleType(websiteSections, "rich_text");
    }
    if (suggestion.key === "final-cta") {
      return !hasVisibleType(websiteSections, "cta_banner");
    }
    if (suggestion.key === "security") {
      return !websiteSections.some(
        (section) =>
          section.section_type === "image_text" &&
          /security|secure|confidential|data|document/i.test(`${section.content_json.heading} ${section.content_json.body}`)
      );
    }
    return true;
  });
  const recommendedAdditions = suggestedToShow.filter((suggestion) =>
    ["trust", "pain", "process", "security", "final-cta"].includes(suggestion.key)
  );

  useEffect(() => {
    if (pageQuery.data && !dirty) {
      setSections(pageQuery.data.sections);
      setPublishedAt(new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(pageQuery.data.published_at)));
    }
  }, [dirty, pageQuery.data]);

  useEffect(() => {
    if (sectionPendingRemovalId && !sectionPendingRemoval) {
      setSectionPendingRemovalId(null);
    }
  }, [sectionPendingRemoval, sectionPendingRemovalId]);

  function updateSections(nextSections: PageSection[]) {
    setSections(nextSections.map((section, index) => ({ ...section, position: index + 1 })));
    setDirty(true);
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...websiteSections];
    const target = index + direction;
    if (target < 0 || target >= next.length) {
      return;
    }
    [next[index], next[target]] = [next[target], next[index]];
    updateSections([...next, ...dedicatedSections]);
  }

  function toggle(sectionId: string) {
    updateSections(
      sortedSections.map((section) =>
        section.id === sectionId ? { ...section, is_visible: !section.is_visible } : section
      )
    );
  }

  function requestRemove(sectionId: string) {
    setSectionPendingRemovalId(sectionId);
  }

  function confirmRemove() {
    if (!sectionPendingRemovalId) {
      return;
    }
    updateSections(sortedSections.filter((section) => section.id !== sectionPendingRemovalId));
    setSectionPendingRemovalId(null);
  }

  function addSuggestedSection(createSection: () => PageSection) {
    updateSections([...websiteSections, createSection(), ...dedicatedSections]);
  }

  function applyRecommendedLayout() {
    const nextSections = [...websiteSections];
    for (const suggestion of recommendedAdditions) {
      nextSections.push(suggestion.section());
    }
    updateSections([...nextSections, ...dedicatedSections]);
    setShowRecommendedConfirm(false);
  }

  function saveDraft() {
    setActionError(null);
    startTransition(async () => {
      try {
        await adminApi.updateDraft(sortedSections);
        await queryClient.invalidateQueries({ queryKey: ["admin-page", "home"] });
        setDirty(false);
      } catch (caught) {
        setActionError(caught instanceof Error ? caught.message : "Could not save draft.");
      }
    });
  }

  function publish() {
    setActionError(null);
    startTransition(async () => {
      try {
        if (dirty) {
          await adminApi.updateDraft(sortedSections);
        }
        const result = await adminApi.publish();
        setPublishedAt(new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(result.published_at)));
        await queryClient.invalidateQueries({ queryKey: ["admin-page", "home"] });
        setDirty(false);
      } catch (caught) {
        setActionError(caught instanceof Error ? caught.message : "Could not publish changes.");
      }
    });
  }

  if (pageQuery.isLoading) {
    return <div className="rounded-lg border bg-card p-6 text-muted-foreground">Loading your home page...</div>;
  }

  if (pageQuery.isError) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h1 className="font-serif text-2xl font-bold text-primary">Could not load the home page</h1>
        <p className="mt-2 text-muted-foreground">
          Please sign in again or refresh the page. If this keeps happening, try again in a few minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-md bg-accent/15 px-3 py-1 text-xs font-semibold uppercase text-accent">
              <Sparkles size={14} /> Guided landing page
            </p>
            <h1 className="font-serif text-3xl font-bold text-primary">Your website</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Your page starts with the essentials. Add proof, explain your process, and publish when the page feels ready.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Last published {publishedAt || "not published yet"}</p>
            {dirty ? <p className="mt-2 text-sm font-semibold text-secondary">Draft changes not yet published.</p> : null}
            {actionError ? <p className="mt-2 max-w-2xl text-sm font-medium text-destructive">{actionError}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" type="button" onClick={() => setShowRecommendedConfirm(true)}>
              <Sparkles size={16} /> Apply Suggested Structure
            </Button>
            <Button variant="outline" type="button" onClick={saveDraft} disabled={isPending}>
              <Save size={16} /> Save Draft
            </Button>
            <Link className="inline-flex min-h-10 items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold" href="/admin/website/preview">
              <Eye size={16} /> Preview Website
            </Link>
            <Button type="button" onClick={publish} disabled={isPending}>
              <Send size={16} /> Publish Changes
            </Button>
          </div>
        </div>
      </div>

      {showRecommendedConfirm ? (
        <div className="rounded-lg border border-secondary/30 bg-secondary/10 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="font-semibold text-primary">Apply suggested structure?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This keeps your existing content and only adds missing recommended sections.
              </p>
              <div className="mt-4 grid gap-2 text-sm">
                {recommendedAdditions.length ? (
                  recommendedAdditions.map((suggestion) => (
                    <div className="flex gap-2" key={suggestion.key}>
                      <CheckCircle2 className="mt-0.5 text-accent" size={16} aria-hidden="true" />
                      <span>Add {suggestion.title}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 text-accent" size={16} aria-hidden="true" />
                    <span>Your recommended structure is already present.</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" type="button" onClick={() => setShowRecommendedConfirm(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={applyRecommendedLayout} disabled={!recommendedAdditions.length}>
                Add Sections
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {sectionPendingRemoval ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-primary/55 px-4 py-6" role="presentation">
          <div
            aria-describedby="remove-section-description"
            aria-labelledby="remove-section-title"
            aria-modal="true"
            className="w-full max-w-md rounded-lg border bg-card p-5 shadow-2xl"
            role="dialog"
          >
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
                <Trash2 size={18} aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-primary" id="remove-section-title">
                  Remove {sectionGuides[sectionPendingRemoval.section_type].label}?
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground" id="remove-section-description">
                  This removes the section from your draft. The published website changes only after you publish.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" type="button" onClick={() => setSectionPendingRemovalId(null)}>
                Cancel
              </Button>
              <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90" type="button" onClick={confirmRemove}>
                Remove Section
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="grid gap-4 self-start xl:sticky xl:top-20">
          <section className="rounded-lg border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-primary">Readiness</h2>
                <p className="mt-1 text-sm text-muted-foreground">{visibleCount} visible sections</p>
              </div>
              <div className="grid h-16 w-16 place-items-center rounded-full border bg-background text-lg font-bold text-primary">
                {readiness.score}%
              </div>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${readiness.score}%` }} />
            </div>
            <div className="mt-5 rounded-md border bg-background p-3">
              <p className="text-sm font-semibold text-primary">
                Required basics: {readiness.requiredComplete === readiness.requiredBasics.length ? "Complete" : `${readiness.requiredComplete} of ${readiness.requiredBasics.length}`}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Trust boosters: {readiness.trustComplete} of {readiness.trustBoosters.length} added
              </p>
            </div>
            <div className="mt-5 grid gap-3">
              {readiness.requiredBasics.map((check) => (
                <div className="flex gap-2 text-sm" key={check.label}>
                  {check.done ? (
                    <CheckCircle2 className="mt-0.5 text-accent" size={16} aria-hidden="true" />
                  ) : (
                    <AlertCircle className="mt-0.5 text-secondary" size={16} aria-hidden="true" />
                  )}
                  <span className={check.done ? "text-muted-foreground" : "font-medium text-primary"}>{check.label}</span>
                </div>
              ))}
            </div>
            <details className="mt-4 rounded-md border bg-background p-3">
              <summary className="cursor-pointer text-sm font-semibold text-primary">Trust boosters</summary>
              <div className="mt-3 grid gap-3">
                {readiness.trustBoosters.map((check) => (
                  <div className="flex gap-2 text-sm" key={check.label}>
                    {check.done ? (
                      <CheckCircle2 className="mt-0.5 text-accent" size={16} aria-hidden="true" />
                    ) : (
                      <AlertCircle className="mt-0.5 text-secondary" size={16} aria-hidden="true" />
                    )}
                    <span className={check.done ? "text-muted-foreground" : "font-medium text-primary"}>{check.label}</span>
                  </div>
                ))}
              </div>
            </details>
          </section>

          <section className="rounded-lg border bg-card p-5">
            <h2 className="font-semibold text-primary">Page gaps</h2>
            {missingRequired.length || missingRecommended.length ? (
              <div className="mt-4 grid gap-3 text-sm">
                {missingRequired.map((type) => (
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive" key={type}>
                    Required: {sectionGuides[type].label}
                  </p>
                ))}
                {missingRecommended.slice(0, 3).map((type) => (
                  <p className="rounded-md border bg-background p-3 text-muted-foreground" key={type}>
                    Trust booster: {sectionGuides[type].label}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">The main conversion blocks are in place.</p>
            )}
          </section>
        </aside>

        <div className="grid gap-6">
          <section className="rounded-lg border bg-card p-5">
            <div className="flex items-start gap-3">
              <Lightbulb className="mt-1 text-secondary" size={20} aria-hidden="true" />
              <div>
                <h2 className="font-semibold text-primary">Suggested next sections</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Recommendations change based on your services and missing trust boosters.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {suggestedToShow.slice(0, 6).map((suggestion) => (
                <div className="rounded-md border bg-background p-4" key={suggestion.key}>
                  <h3 className="font-semibold text-primary">{suggestion.title}</h3>
                  <p className="mt-2 min-h-10 text-sm leading-6 text-muted-foreground">{suggestion.description}</p>
                  <button
                    className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold"
                    type="button"
                    onClick={() => addSuggestedSection(suggestion.section)}
                  >
                    <Plus size={15} /> Add
                  </button>
                </div>
              ))}
              {!suggestedToShow.length ? (
                <div className="rounded-md border bg-background p-4 text-sm text-muted-foreground">
                  Your recommended section set is already present.
                </div>
              ) : null}
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border bg-card">
            <div className="border-b bg-muted/60 px-4 py-3">
              <h2 className="font-semibold text-primary">Page outline</h2>
              <p className="mt-1 text-sm text-muted-foreground">Edit content safely. Layout and styling stay controlled.</p>
            </div>
            <div className="hidden grid-cols-[44px_1fr_120px_112px_120px] border-b bg-muted/30 px-4 py-3 text-sm font-semibold text-muted-foreground lg:grid">
              <span className="sr-only">Move</span>
              <span>Section</span>
              <span>Importance</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {websiteSections.map((section, index) => {
              const guide = sectionGuides[section.section_type];
              const status = sectionStatus(section);
              return (
                <div className="grid gap-4 border-b px-4 py-4 last:border-b-0 lg:grid-cols-[44px_1fr_120px_112px_120px] lg:items-center" key={section.id}>
                  <div className="flex items-center gap-2">
                    <GripVertical size={18} aria-hidden="true" />
                    <div className="flex gap-1 lg:grid lg:gap-1">
                      <button className="grid h-6 w-6 place-items-center rounded border text-muted-foreground disabled:opacity-40" type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${guide.label} up`}>
                        <ArrowUp size={13} aria-hidden="true" />
                      </button>
                      <button className="grid h-6 w-6 place-items-center rounded border text-muted-foreground disabled:opacity-40" type="button" onClick={() => move(index, 1)} disabled={index === websiteSections.length - 1} aria-label={`Move ${guide.label} down`}>
                        <ArrowDown size={13} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-primary">{guide.label}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{guide.purpose}</p>
                  </div>
                  <span className="w-fit rounded-md border bg-background px-3 py-1 text-sm font-semibold text-muted-foreground">
                    {guide.importance}
                  </span>
                  <button
                    className={`w-fit rounded-md px-3 py-1 text-sm font-semibold ${
                      status === "Complete"
                        ? "bg-accent text-accent-foreground"
                        : status === "Hidden"
                          ? "bg-muted text-muted-foreground"
                          : "bg-secondary/15 text-secondary"
                    }`}
                    type="button"
                    onClick={() => toggle(section.id)}
                  >
                    {status}
                  </button>
                  <div className="flex items-center gap-2">
                    <Link className="rounded-md border px-3 py-2 text-sm font-semibold" href={`/admin/website/sections/${section.id}`}>
                      Edit
                    </Link>
                    <button className="rounded-md border p-2 text-destructive" type="button" onClick={() => requestRemove(section.id)} aria-label="Remove section">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      </div>
    </div>
  );
}
