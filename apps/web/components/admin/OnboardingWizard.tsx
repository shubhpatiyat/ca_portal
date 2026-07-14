"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { adminApi } from "@/lib/api/admin";
import { onboardingSchema } from "@/lib/validation/sections";
import { Button } from "@/components/ui/Button";

const services = [
  "Income Tax Filing",
  "GST Registration & Returns",
  "Accounting & Bookkeeping",
  "TDS & Payroll Compliance",
  "Audit & Financial Reporting"
];

const steps = ["About your firm", "Contact details", "Services you offer", "Branding", "Review and publish"];

type OnboardingValues = z.infer<typeof onboardingSchema>;
type OnboardingFieldName = keyof OnboardingValues;

const reservedSubdomains = new Set([
  "admin",
  "api",
  "app",
  "auth",
  "billing",
  "dashboard",
  "docs",
  "help",
  "login",
  "mail",
  "settings",
  "status",
  "support",
  "www"
]);

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63)
    .replace(/-+$/g, "");
}

function previewSubdomain(value: string): string {
  const slug = slugify(value) || "firm";
  if (reservedSubdomains.has(slug) || slug.length < 3) {
    return slug.length >= 3 ? `${slug}-site` : "firm";
  }
  return slug;
}

function previewDefaultUrl(firmName: string): string {
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ?? "lvh.me:3000";
  const scheme = process.env.NEXT_PUBLIC_PLATFORM_SCHEME ?? "http";
  return `${scheme}://${previewSubdomain(firmName)}.${platformDomain}`;
}

function landingPagePreview(values: OnboardingValues) {
  const firmName = values.firmName || "Your firm";
  const city = values.city || "your city";
  const selectedServices = values.services.length ? values.services : ["Your services"];

  return [
    {
      title: "Hero",
      description: "Accurate Books. On Time, Every Time.",
      detail: `${firmName} gets a consultation-focused outsourced accounts landing page for MSMEs in ${city}.`
    },
    {
      title: "Value propositions",
      description: "Cost savings, accuracy, scale, and transparency.",
      detail: selectedServices.join(", ")
    },
    {
      title: "About story",
      description: "Why We Started This",
      detail: "The first draft explains the MSME accounting gap this firm was built to close."
    },
    {
      title: "Security and FAQ",
      description: "Data care, NDA commitment, and common buyer questions.",
      detail: "The first draft includes detailed security copy and FAQ answers."
    },
    {
      title: "Contact section",
      description: values.phone || values.email || "Your contact details",
      detail: `${firmName} in ${city} will receive a consultation-focused contact section.`
    }
  ];
}

const stepFields: Record<number, OnboardingFieldName[]> = {
  0: ["firmName", "founderName", "city", "address"],
  1: ["phone", "whatsapp", "email"],
  2: ["services"],
  3: ["templateKey", "themeKey"]
};

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      firmName: "",
      founderName: "",
      city: "",
      address: "",
      phone: "",
      whatsapp: "",
      email: "",
      services: [],
      templateKey: "modern_ca",
      themeKey: "navy_gold"
    }
  });
  const watchedFirmName = form.watch("firmName");
  const watchedValues = form.watch();
  const defaultUrlPreview = useMemo(() => previewDefaultUrl(watchedFirmName), [watchedFirmName]);
  const previewSections = useMemo(() => landingPagePreview(watchedValues), [watchedValues]);

  async function goNext() {
    const fields = stepFields[step] ?? [];
    const valid = await form.trigger(fields);
    if (valid) {
      setStep((value) => Math.min(steps.length - 1, value + 1));
    }
  }

  function finish(values: OnboardingValues) {
    setError(null);
    startTransition(async () => {
      try {
        await adminApi.onboard(values);
        router.push("/admin/website/preview");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not create the website.");
      }
    });
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border bg-card p-5">
        <div className="grid gap-3 md:grid-cols-5">
          {steps.map((label, index) => (
            <div className="flex items-center gap-2 text-sm" key={label}>
              <span className={`grid h-7 w-7 place-items-center rounded-full ${index <= step ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {index < step ? <Check size={16} /> : index + 1}
              </span>
              <span className={index === step ? "font-semibold text-primary" : "text-muted-foreground"}>{label}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-md border bg-background p-3 text-sm text-muted-foreground">
          Nothing here is permanent. This creates a clean first draft that you can refine section by section after onboarding.
        </p>
      </div>

      <form className="rounded-lg border bg-card p-6 shadow-sm" onSubmit={form.handleSubmit(finish)}>
        {step === 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field error={form.formState.errors.firmName?.message} label="Firm name" placeholder="Your CA firm" register={form.register("firmName")} />
            <Field error={form.formState.errors.founderName?.message} label="CA / founder name" placeholder="Founder name" register={form.register("founderName")} />
            <Field error={form.formState.errors.city?.message} label="City" placeholder="Your city" register={form.register("city")} />
            <Field error={form.formState.errors.address?.message} label="Office address" placeholder="Your office address" register={form.register("address")} />
          </div>
        ) : null}
        {step === 1 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field error={form.formState.errors.phone?.message} label="Phone" placeholder="+91 90000 12345" register={form.register("phone")} />
            <Field error={form.formState.errors.whatsapp?.message} label="WhatsApp" placeholder="+91 90000 12345" register={form.register("whatsapp")} />
            <Field error={form.formState.errors.email?.message} label="Email" placeholder="office@example.in" register={form.register("email")} type="email" />
          </div>
        ) : null}
        {step === 2 ? (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              {services.map((service) => (
                <label className="flex items-center gap-3 rounded-md border p-3 text-sm font-medium" key={service}>
                  <input type="checkbox" value={service} {...form.register("services")} />
                  {service}
                </label>
              ))}
            </div>
            {form.formState.errors.services?.message ? (
              <p className="mt-3 text-sm font-medium text-destructive">{form.formState.errors.services.message}</p>
            ) : null}
          </>
        ) : null}
        {step === 3 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Website style
              <select className="min-h-11 rounded-md border px-3" {...form.register("templateKey")}>
                <option value="modern_ca">Modern CA</option>
                <option value="traditional_ca">Traditional CA</option>
                <option value="premium_ca">Premium CA</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Theme
              <select className="min-h-11 rounded-md border px-3" {...form.register("themeKey")}>
                <option value="navy_gold">Navy and gold</option>
                <option value="emerald_cream">Emerald and cream</option>
                <option value="charcoal_blue">Charcoal and blue</option>
              </select>
            </label>
          </div>
        ) : null}
        {step === 4 ? (
          <div className="grid gap-4">
            <h2 className="font-serif text-2xl font-bold text-primary">Ready homepage</h2>
            <p className="text-muted-foreground">
              Review the first draft section by section. You can edit every section after the preview is created.
            </p>
            <div className="rounded-lg border bg-background p-4 text-sm">
              <strong>{form.watch("firmName")}</strong> in {form.watch("city")} with {form.watch("services").length} selected services.
            </div>
            <div className="rounded-lg border bg-background p-4 text-sm">
              <p className="font-semibold text-primary">Default website URL</p>
              <p className="mt-1 break-all text-muted-foreground">{defaultUrlPreview}</p>
            </div>
            <div className="grid gap-3">
              {previewSections.map((section, index) => (
                <div className="rounded-lg border bg-background p-4" key={section.title}>
                  <div className="flex items-start gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-primary">{section.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                      <p className="mt-2 text-sm leading-6">{section.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {error ? <p className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
        <div className="mt-6 flex justify-between">
          <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>
            <ChevronLeft size={16} /> Back
          </Button>
          {step < steps.length - 1 ? (
            <Button type="button" onClick={goNext}>
              Next <ChevronRight size={16} />
            </Button>
          ) : (
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create preview"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  register,
  type = "text",
  placeholder,
  error
}: {
  label: string;
  register: ReturnType<typeof useForm<OnboardingValues>>["register"] extends (name: never) => infer R ? R : never;
  type?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input className="min-h-11 rounded-md border px-3" placeholder={placeholder} type={type} {...register} />
      {error ? <span className="text-xs font-medium text-destructive">{error}</span> : null}
    </label>
  );
}
