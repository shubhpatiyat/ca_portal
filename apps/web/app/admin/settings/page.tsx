"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";

export default function SettingsPage() {
  const meQuery = useQuery({
    queryKey: ["admin-me"],
    queryFn: adminApi.me,
    retry: false
  });
  const organization = meQuery.data?.organization;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-primary">Settings</h1>
        <p className="mt-2 text-muted-foreground">Manage members, publishing access and website domains.</p>
      </div>

      <section className="rounded-lg border bg-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-primary">Default website domain</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This platform domain is created from your firm name and stays available as your built-in website address.
            </p>
          </div>
          {organization?.default_url ? (
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-semibold"
              href={organization.default_url}
              target="_blank"
            >
              Open <ExternalLink size={16} />
            </Link>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-md border bg-background p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Subdomain</p>
            <p className="mt-2 break-all font-medium text-primary">
              {meQuery.isLoading ? "Loading..." : organization?.default_subdomain ?? "Not generated yet"}
            </p>
          </div>
          <div className="rounded-md border bg-background p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Website URL</p>
            <p className="mt-2 break-all font-medium text-primary">
              {meQuery.isLoading ? "Loading..." : organization?.default_url ?? "Not generated yet"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
