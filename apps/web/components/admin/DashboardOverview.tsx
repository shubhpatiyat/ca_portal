"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ButtonLink } from "@/components/ui/Button";
import { adminApi } from "@/lib/api/admin";

export function DashboardOverview() {
  const pageQuery = useQuery({ queryKey: ["admin-page", "home"], queryFn: adminApi.homePage, retry: false });
  const leadsQuery = useQuery({ queryKey: ["leads"], queryFn: adminApi.leads, retry: false });
  const metrics = useMemo(() => {
    const sections = pageQuery.data?.sections ?? [];
    const leads = leadsQuery.data ?? [];
    return [
      ["Draft sections", String(sections.length)],
      ["New leads", String(leads.filter((lead) => lead.status === "new").length)],
      ["Visible sections", String(sections.filter((section) => section.is_visible).length)],
      ["Template", pageQuery.data?.template_key.replace("_", " ") ?? "Loading"]
    ];
  }, [leadsQuery.data, pageQuery.data]);

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="font-serif text-3xl font-bold text-primary">Overview</h1>
        <p className="mt-2 text-muted-foreground">
          {pageQuery.isLoading ? "Loading website data from the API..." : "Your website data is coming from FastAPI and Supabase Postgres."}
        </p>
        {pageQuery.isError ? (
          <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            Could not load the dashboard data. Check the API server, auth token, migrations and seed data.
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <ButtonLink href="/admin/website">Edit home page</ButtonLink>
          <ButtonLink href="/admin/onboarding" variant="outline">Run onboarding</ButtonLink>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {metrics.map(([label, value]) => (
          <div className="rounded-lg border bg-card p-5" key={label}>
            <p className="text-sm text-muted-foreground">{label}</p>
            <strong className="mt-2 block text-2xl capitalize text-primary">{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
