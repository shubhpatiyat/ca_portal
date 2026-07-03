"use client";

import { useQuery } from "@tanstack/react-query";
import type { FaqSection, ServiceGridSection } from "@/types/site";
import { adminApi } from "@/lib/api/admin";

export function ServicesFromApi() {
  const pageQuery = useQuery({ queryKey: ["admin-page", "home"], queryFn: adminApi.homePage, retry: false });
  const serviceSection = pageQuery.data?.sections.find((section): section is ServiceGridSection => section.section_type === "service_grid");

  return (
    <div className="grid gap-6">
      <h1 className="font-serif text-3xl font-bold text-primary">Services</h1>
      {pageQuery.isLoading ? <p className="text-muted-foreground">Loading services from the API...</p> : null}
      {pageQuery.isError ? <p className="text-destructive">Could not load services from the API.</p> : null}
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
  const pageQuery = useQuery({ queryKey: ["admin-page", "home"], queryFn: adminApi.homePage, retry: false });
  const faqSection = pageQuery.data?.sections.find((section): section is FaqSection => section.section_type === "faq");

  return (
    <div className="grid gap-6">
      <h1 className="font-serif text-3xl font-bold text-primary">FAQs</h1>
      {pageQuery.isLoading ? <p className="text-muted-foreground">Loading FAQs from the API...</p> : null}
      {pageQuery.isError ? <p className="text-destructive">Could not load FAQs from the API.</p> : null}
      <div className="divide-y rounded-lg border bg-card">
        {faqSection?.content_json.items.map((item) => (
          <div className="p-5" key={item.question}>
            <h2 className="font-semibold text-primary">{item.question}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContactDetailsFromApi() {
  const pageQuery = useQuery({ queryKey: ["admin-page", "home"], queryFn: adminApi.homePage, retry: false });

  return (
    <div className="rounded-lg border bg-card p-6">
      <h1 className="font-serif text-3xl font-bold text-primary">Contact Details</h1>
      {pageQuery.isLoading ? <p className="mt-3 text-muted-foreground">Loading contact details from the API...</p> : null}
      {pageQuery.isError ? <p className="mt-3 text-destructive">Could not load contact details from the API.</p> : null}
      <dl className="mt-6 grid gap-4 md:grid-cols-2">
        {pageQuery.data
          ? Object.entries(pageQuery.data.contact).map(([label, value]) => (
              <div className="rounded-md border bg-background p-4" key={label}>
                <dt className="text-sm font-semibold capitalize text-muted-foreground">{label.replace("_", " ")}</dt>
                <dd className="mt-2 text-primary">{value}</dd>
              </div>
            ))
          : null}
      </dl>
    </div>
  );
}
