"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ButtonLink } from "@/components/ui/Button";
import { adminApi, type AnalyticsMetric } from "@/lib/api/admin";

export function DashboardOverview() {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const analyticsQuery = useQuery({
    queryKey: ["analytics-summary", days],
    queryFn: () => adminApi.analyticsSummary(days),
    retry: false
  });
  const summary = analyticsQuery.data;
  const metrics: Array<{
    label: string;
    metric?: AnalyticsMetric;
    suffix?: string;
    help: string;
  }> = [
    { label: "Visitors", metric: summary?.visitors, help: "Unique anonymous website sessions." },
    { label: "Page views", metric: summary?.page_views, help: "Total public website pages viewed." },
    { label: "New enquiries", metric: summary?.new_enquiries, help: "Contact forms submitted in this period." },
    { label: "Conversion rate", metric: summary?.conversion_rate, suffix: "%", help: "Enquiries divided by visitors." },
    { label: "Phone clicks", metric: summary?.phone_clicks, help: "Clicks on a displayed phone number." },
    { label: "WhatsApp clicks", metric: summary?.whatsapp_clicks, help: "Clicks that opened WhatsApp." },
    { label: "Email clicks", metric: summary?.email_clicks, help: "Clicks on an email address." },
    { label: "Client logins", metric: summary?.client_logins, help: "Successful client portal sign-ins." }
  ];

  function comparison(metric?: AnalyticsMetric): string {
    if (!metric) {
      return "Loading comparison";
    }
    if (metric.previous === 0) {
      return metric.value > 0 ? `New in this ${days}-day period` : `No activity in either period`;
    }
    const change = metric.change_percent ?? 0;
    return `${change >= 0 ? "+" : ""}${change}% vs previous ${days} days`;
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-primary">Website performance</h1>
            <p className="mt-2 text-muted-foreground">
              Track visits, enquiries, contact actions and successful client logins.
            </p>
          </div>
          <div className="inline-flex w-fit rounded-lg border bg-muted/45 p-1" aria-label="Analytics period">
            {([7, 30, 90] as const).map((value) => (
              <button
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                  days === value ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-primary"
                }`}
                key={value}
                onClick={() => setDays(value)}
                type="button"
              >
                {value} days
              </button>
            ))}
          </div>
        </div>
        {analyticsQuery.isError ? (
          <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            We could not load website analytics. Please sign in again or try refreshing the page.
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <ButtonLink href="/admin/website">Edit home page</ButtonLink>
          <ButtonLink href="/admin/leads" variant="outline">View enquiries</ButtonLink>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, metric, suffix, help }) => (
          <div className="rounded-lg border bg-card p-5 shadow-sm" key={label}>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <strong className="mt-2 block text-3xl text-primary">
              {metric ? `${metric.value}${suffix ?? ""}` : "—"}
            </strong>
            <p className="mt-3 text-xs font-medium text-muted-foreground">{comparison(metric)}</p>
            <p className="mt-3 border-t pt-3 text-xs leading-5 text-muted-foreground">{help}</p>
          </div>
        ))}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        Analytics are anonymous and begin collecting after this feature is deployed. Admin and client-portal page views are excluded.
      </p>
    </div>
  );
}
