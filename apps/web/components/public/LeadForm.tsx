"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { submitLead } from "@/lib/api/public";
import { leadFormSchema } from "@/lib/validation/sections";

type LeadFormValues = z.infer<typeof leadFormSchema>;

export function LeadForm({
  organizationSlug,
  pageSlug
}: {
  organizationSlug: string;
  pageSlug: string;
}) {
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: "",
      business_name: "",
      city: "",
      phone: "",
      email: "",
      inquiry_type: "Free consultation",
      service_interest: "Free consultation",
      message: "",
      website: ""
    }
  });

  function onSubmit(values: LeadFormValues) {
    startTransition(async () => {
      await submitLead({
        organization_slug: organizationSlug,
        source_page_slug: pageSlug,
        name: values.name,
        phone: values.phone,
        email: values.email || undefined,
        business_name: values.business_name || undefined,
        city: values.city || undefined,
        inquiry_type: values.inquiry_type,
        service_interest: values.inquiry_type,
        message: values.message,
        website: values.website
      });
      setSaved(true);
      form.reset();
    });
  }

  return (
    <form
      className="text-foreground"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <div className="grid gap-6">
        <label className="grid gap-2 text-sm font-medium">
          Name
          <input className="min-h-12 rounded-lg border border-border bg-muted/55 px-3 outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/30" placeholder="Enter your name" {...form.register("name")} />
          {form.formState.errors.name ? <span className="text-destructive">{form.formState.errors.name.message}</span> : null}
        </label>
        <div className="grid gap-6 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            Business Name
            <input className="min-h-12 rounded-lg border border-border bg-muted/55 px-3 outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/30" placeholder="Your business name" {...form.register("business_name")} />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            City
            <input className="min-h-12 rounded-lg border border-border bg-muted/55 px-3 outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/30" placeholder="Your city" {...form.register("city")} />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-medium">
          Phone Number
          <input className="min-h-12 rounded-lg border border-border bg-muted/55 px-3 outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/30" placeholder="+91 98765 43210" {...form.register("phone")} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Email
          <input className="min-h-12 rounded-lg border border-border bg-muted/55 px-3 outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/30" placeholder="you@example.com" type="email" {...form.register("email")} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          What are you looking for?
          <select className="min-h-12 rounded-lg border border-border bg-muted/55 px-3 outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/30" {...form.register("inquiry_type")}>
            <option>Free consultation</option>
            <option>General inquiry</option>
            <option>Join our team</option>
            <option>Other</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Your Message
          <textarea className="min-h-32 rounded-lg border border-border bg-muted/55 px-3 py-2 outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/30" placeholder="How can we help you?" {...form.register("message")} />
        </label>
        <label className="hidden">
          Website
          <input tabIndex={-1} autoComplete="off" {...form.register("website")} />
        </label>
      </div>
      <button
        className="mt-6 min-h-12 w-full rounded-lg bg-secondary px-4 py-3 text-sm font-semibold uppercase tracking-[0.05em] text-secondary-foreground shadow-md transition hover:opacity-90 disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Sending..." : "Send Message"}
      </button>
      {saved ? <p className="mt-3 text-sm font-medium text-accent">Request saved. The firm can now see it in Leads.</p> : null}
    </form>
  );
}
