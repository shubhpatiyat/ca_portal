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

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      firmName: "Sharma & Associates",
      founderName: "CA Anirudh Sharma",
      city: "Jaipur",
      address: "C-Scheme, Jaipur, Rajasthan 302001",
      phone: "+91 90000 12345",
      whatsapp: "+91 90000 12345",
      email: "office@sharmaassociates.in",
      services,
      templateKey: "modern_ca",
      themeKey: "navy_gold"
    }
  });
  const watchedFirmName = form.watch("firmName");
  const defaultUrlPreview = useMemo(() => previewDefaultUrl(watchedFirmName), [watchedFirmName]);

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
      </div>

      <form className="rounded-lg border bg-card p-6 shadow-sm" onSubmit={form.handleSubmit(finish)}>
        {step === 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Firm name" register={form.register("firmName")} />
            <Field label="CA / founder name" register={form.register("founderName")} />
            <Field label="City" register={form.register("city")} />
            <Field label="Office address" register={form.register("address")} />
          </div>
        ) : null}
        {step === 1 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Phone" register={form.register("phone")} />
            <Field label="WhatsApp" register={form.register("whatsapp")} />
            <Field label="Email" register={form.register("email")} type="email" />
          </div>
        ) : null}
        {step === 2 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {services.map((service) => (
              <label className="flex items-center gap-3 rounded-md border p-3 text-sm font-medium" key={service}>
                <input type="checkbox" value={service} {...form.register("services")} />
                {service}
              </label>
            ))}
          </div>
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
              The platform will create your organization, owner access, website settings, default home page, draft sections and a private preview.
            </p>
            <div className="rounded-lg border bg-background p-4 text-sm">
              <strong>{form.watch("firmName")}</strong> in {form.watch("city")} with {form.watch("services").length} selected services.
            </div>
            <div className="rounded-lg border bg-background p-4 text-sm">
              <p className="font-semibold text-primary">Default website URL</p>
              <p className="mt-1 break-all text-muted-foreground">{defaultUrlPreview}</p>
            </div>
          </div>
        ) : null}
        {error ? <p className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
        <div className="mt-6 flex justify-between">
          <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>
            <ChevronLeft size={16} /> Back
          </Button>
          {step < steps.length - 1 ? (
            <Button type="button" onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))}>
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
  type = "text"
}: {
  label: string;
  register: ReturnType<typeof useForm<OnboardingValues>>["register"] extends (name: never) => infer R ? R : never;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input className="min-h-11 rounded-md border px-3" type={type} {...register} />
    </label>
  );
}
