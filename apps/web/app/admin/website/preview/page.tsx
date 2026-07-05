"use client";

import { ExternalLink, PencilLine } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import { resolveAdminWebsiteUrl } from "@/lib/admin/website-url";
import { ButtonLink } from "@/components/ui/Button";

export default function PreviewPage() {
  const meQuery = useQuery({ queryKey: ["admin-me"], queryFn: adminApi.me, retry: false });
  const organization = meQuery.data?.organization;
  const websiteUrl = organization
    ? resolveAdminWebsiteUrl(organization.default_url, organization.slug, organization.default_subdomain)
    : "";

  if (meQuery.isLoading) {
    return <div className="rounded-lg border bg-card p-6 text-muted-foreground">Loading website link...</div>;
  }

  if (meQuery.isError || !organization) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h1 className="font-serif text-2xl font-bold text-primary">Could not load website link</h1>
        <p className="mt-2 text-muted-foreground">Please refresh the page or sign in again.</p>
      </div>
    );
  }

  return (
    <div className="grid min-h-[65vh] place-items-center">
      <section className="w-full max-w-2xl rounded-lg border bg-card p-6 text-center shadow-soft">
        <h1 className="font-serif text-3xl font-bold text-primary">Open your website</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          View the public site in a new window, or return to the website editor.
        </p>
        <p className="mx-auto mt-5 max-w-xl break-all rounded-md border bg-background px-4 py-3 text-sm text-muted-foreground">
          {websiteUrl}
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href={websiteUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={16} /> View website
          </ButtonLink>
          <ButtonLink href="/admin/website" variant="outline">
            <PencilLine size={16} /> Continue editing
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
