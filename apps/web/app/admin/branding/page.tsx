"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ExternalLink, Save } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import { resolveAdminWebsiteUrl } from "@/lib/admin/website-url";
import { brandFaviconUrl, brandInitials } from "@/lib/brand";
import { Button } from "@/components/ui/Button";

export default function BrandingPage() {
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ["admin-me"], queryFn: adminApi.me, retry: false });
  const organization = meQuery.data?.organization;
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (organization) {
      setName(organization.name);
      setCity(organization.city);
    }
  }, [organization]);

  const displayName = name.trim() || organization?.name || "Your Firm";
  const initials = brandInitials(displayName);
  const faviconUrl = brandFaviconUrl(displayName);
  const websiteUrl = organization ? resolveAdminWebsiteUrl(organization.default_url, organization.slug, organization.default_subdomain) : null;

  function saveBranding() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const updated = await adminApi.updateOrganization({ name: displayName, city: city.trim() || undefined });
        setName(updated.name);
        setCity(updated.city);
        await queryClient.invalidateQueries({ queryKey: ["admin-me"] });
        await queryClient.invalidateQueries({ queryKey: ["admin-page", "home"] });
        setMessage("Branding saved. Your public heading and favicon will use this identity.");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not save branding.");
      }
    });
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-primary">Branding</h1>
        <p className="mt-2 text-muted-foreground">Control the public firm name, browser tab icon and basic brand lockup.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold text-primary">Public identity</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This name appears in the public header, footer, SEO title and generated favicon.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Firm display name
              <input
                className="min-h-11 rounded-md border bg-background px-3"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your CA firm"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              City
              <input
                className="min-h-11 rounded-md border bg-background px-3"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Your city"
              />
            </label>
          </div>

          {message ? <p className="mt-5 rounded-md border border-accent/30 bg-accent/10 p-3 text-sm font-medium text-accent">{message}</p> : null}
          {error ? <p className="mt-5 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</p> : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" disabled={isPending || !displayName} onClick={saveBranding}>
              <Save size={16} /> {isPending ? "Saving..." : "Save Branding"}
            </Button>
            {websiteUrl ? (
              <Link className="inline-flex min-h-10 items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-semibold" href={websiteUrl} target="_blank">
                View site <ExternalLink size={16} />
              </Link>
            ) : null}
          </div>
        </section>

        <aside className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold text-primary">Preview</h2>
          <div className="mt-5 rounded-xl border bg-background p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl border-2 border-secondary bg-primary font-serif text-lg font-bold text-primary-foreground">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate font-serif text-xl font-semibold text-primary">{displayName}</p>
                <p className="text-sm text-muted-foreground">{city || "City"}</p>
              </div>
            </div>
          </div>
          <div className="mt-5 rounded-xl border bg-background p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Browser favicon</p>
            <div className="mt-4 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="h-10 w-10 rounded-lg" src={faviconUrl} alt="" />
              <span className="text-sm text-muted-foreground">{displayName}</span>
            </div>
          </div>
        </aside>
      </div>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold text-primary">Approved themes</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            { name: "Navy and emerald", swatches: ["#041627", "#3a674f", "#fbf9f4"] },
            { name: "Emerald and cream", swatches: ["#0f3f35", "#bceecf", "#f7f8ef"] },
            { name: "Charcoal and blue", swatches: ["#222833", "#2e9ad0", "#f3f6f8"] }
          ].map((theme) => (
            <button className="rounded-lg border bg-background p-5 text-left shadow-sm" key={theme.name} type="button">
              <span className="font-semibold text-primary">{theme.name}</span>
              <span className="mt-3 flex gap-2">
                {theme.swatches.map((swatch) => (
                  <span className="h-7 w-7 rounded-full border" style={{ backgroundColor: swatch }} key={swatch} />
                ))}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
