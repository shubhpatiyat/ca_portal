"use client";

import { useState, useTransition } from "react";
import { ArrowRight } from "lucide-react";
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
    <form className="text-[#0b1f33]" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-3.5">
        <label className="grid gap-2 text-[13px] font-bold">
          Name
          <input className="min-h-11 rounded-xl border border-[#d8e2ec] bg-white px-3.5 font-normal outline-none transition placeholder:text-[#516173]/60 focus:border-[#0e7cff] focus:ring-4 focus:ring-[#0e7cff]/10" placeholder="Name" autoComplete="name" {...form.register("name")} />
          {form.formState.errors.name ? <span className="font-medium text-red-600">{form.formState.errors.name.message}</span> : null}
        </label>
        <label className="grid gap-2 text-[13px] font-bold">
          Business Name
          <input className="min-h-11 rounded-xl border border-[#d8e2ec] bg-white px-3.5 font-normal outline-none transition placeholder:text-[#516173]/60 focus:border-[#0e7cff] focus:ring-4 focus:ring-[#0e7cff]/10" placeholder="Business Name" autoComplete="organization" {...form.register("business_name")} />
        </label>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <label className="grid gap-2 text-[13px] font-bold">
            City
            <input className="min-h-11 rounded-xl border border-[#d8e2ec] bg-white px-3.5 font-normal outline-none transition placeholder:text-[#516173]/60 focus:border-[#0e7cff] focus:ring-4 focus:ring-[#0e7cff]/10" placeholder="City" autoComplete="address-level2" {...form.register("city")} />
          </label>
          <label className="grid gap-2 text-[13px] font-bold">
            Email
            <input className="min-h-11 rounded-xl border border-[#d8e2ec] bg-white px-3.5 font-normal outline-none transition placeholder:text-[#516173]/60 focus:border-[#0e7cff] focus:ring-4 focus:ring-[#0e7cff]/10" placeholder="Email" type="email" autoComplete="email" {...form.register("email")} />
          </label>
        </div>
        <label className="grid gap-2 text-[13px] font-bold">
          Phone No.
          <input className="min-h-11 rounded-xl border border-[#d8e2ec] bg-white px-3.5 font-normal outline-none transition placeholder:text-[#516173]/60 focus:border-[#0e7cff] focus:ring-4 focus:ring-[#0e7cff]/10" placeholder="Phone No." type="tel" autoComplete="tel" {...form.register("phone")} />
          {form.formState.errors.phone ? <span className="font-medium text-red-600">{form.formState.errors.phone.message}</span> : null}
        </label>
        <label className="grid gap-2 text-[13px] font-bold">
          What are you looking for?
          <select className="min-h-11 rounded-xl border border-[#d8e2ec] bg-white px-3.5 font-normal outline-none transition focus:border-[#0e7cff] focus:ring-4 focus:ring-[#0e7cff]/10" {...form.register("inquiry_type")}>
            <option>Free consultation</option>
            <option>General inquiry</option>
            <option>Join our team</option>
            <option>Other</option>
          </select>
        </label>
        <label className="grid gap-2 text-[13px] font-bold">
          Message
          <textarea className="min-h-24 resize-y rounded-xl border border-[#d8e2ec] bg-white px-3.5 py-3 font-normal outline-none transition placeholder:text-[#516173]/60 focus:border-[#0e7cff] focus:ring-4 focus:ring-[#0e7cff]/10" placeholder="Message" {...form.register("message")} />
        </label>
        <label className="hidden">
          Website
          <input tabIndex={-1} autoComplete="off" {...form.register("website")} />
        </label>
      </div>
      <button
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0e7cff] px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(14,124,255,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0872ec] disabled:translate-y-0 disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Sending..." : "Book a Free Consultation"}
        {!isPending ? <ArrowRight size={17} aria-hidden="true" /> : null}
      </button>
      {saved ? <p className="mt-3 text-sm font-semibold text-[#059669]">Thank you. Your request has been sent.</p> : null}
    </form>
  );
}
