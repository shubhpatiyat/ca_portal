"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Copy, ExternalLink, RefreshCw, Star, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type CustomDomain } from "@/lib/api/admin";
import { resolveAdminWebsiteUrl } from "@/lib/admin/website-url";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [hostname, setHostname] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);
  const meQuery = useQuery({ queryKey: ["admin-me"], queryFn: adminApi.me, retry: false });
  const domainsQuery = useQuery({ queryKey: ["admin-domains"], queryFn: adminApi.domains, retry: false });
  const organization = meQuery.data?.organization;
  const websiteUrl = organization ? resolveAdminWebsiteUrl(organization.default_url, organization.slug, organization.default_subdomain) : null;
  const platformDomain = domainsQuery.data?.find((domain) => domain.domain_type === "platform");
  const customDomains = domainsQuery.data?.filter((domain) => domain.domain_type === "custom") ?? [];

  function refreshDomains() {
    queryClient.invalidateQueries({ queryKey: ["admin-domains"] });
    queryClient.invalidateQueries({ queryKey: ["admin-me"] });
  }

  function runDomainAction(action: () => Promise<unknown>, successMessage: string) {
    setActionError(null);
    setNotice(null);
    setIsActionPending(true);
    action()
      .then(() => {
        refreshDomains();
        setNotice(successMessage);
      })
      .catch((caught) => {
        setActionError(caught instanceof Error ? caught.message : "Could not update domain settings.");
      })
      .finally(() => setIsActionPending(false));
  }

  function addDomain(formData: FormData) {
    const nextHostname = String(formData.get("hostname") ?? "").trim();
    if (!nextHostname) {
      setActionError("Enter a domain first.");
      return;
    }
    runDomainAction(async () => {
      await adminApi.addDomain(nextHostname);
      setHostname("");
    }, "Custom domain added. Add the DNS records below, then check its status.");
  }

  function copy(value?: string | null) {
    if (!value) {
      return;
    }
    navigator.clipboard.writeText(value).then(() => setNotice("Copied to clipboard."));
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-primary">Settings</h1>
        <p className="mt-2 text-muted-foreground">Manage publishing access and website domains.</p>
      </div>

      {actionError ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{actionError}</p> : null}
      {notice ? <p className="rounded-md border border-accent/30 bg-accent/10 p-3 text-sm text-accent">{notice}</p> : null}

      <section className="rounded-lg border bg-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-primary">Built-in website domain</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This remains available even after you connect a custom domain.
            </p>
          </div>
          {websiteUrl ? (
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-semibold"
              href={websiteUrl}
              target="_blank"
            >
              Open <ExternalLink size={16} />
            </Link>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <InfoBlock label="Subdomain" value={meQuery.isLoading ? "Loading..." : organization?.default_subdomain ?? "Not generated yet"} />
          <InfoBlock label="Current website URL" value={meQuery.isLoading ? "Loading..." : websiteUrl ?? "Not generated yet"} />
          {platformDomain ? <InfoBlock label="Built-in hostname" value={platformDomain.hostname} /> : null}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-6">
        <div>
          <h2 className="text-lg font-semibold text-primary">Custom domain</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect a domain your firm owns, such as www.mehtaandassociates.com.
          </p>
        </div>

        <form className="mt-5 flex flex-col gap-3 sm:flex-row" action={addDomain}>
          <input
            className="min-h-11 flex-1 rounded-md border bg-background px-3 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30"
            name="hostname"
            onChange={(event) => setHostname(event.target.value)}
            placeholder="www.yourfirm.com"
            value={hostname}
          />
          <Button type="submit" disabled={isActionPending}>
            Add domain
          </Button>
        </form>

        <div className="mt-6 grid gap-4">
          {domainsQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading domains...</p> : null}
          {domainsQuery.isError ? <p className="text-sm text-destructive">Could not load domains. Refresh and try again.</p> : null}
          {!domainsQuery.isLoading && !customDomains.length ? (
            <div className="rounded-md border bg-background p-4 text-sm text-muted-foreground">
              No custom domains added yet.
            </div>
          ) : null}
          {customDomains.map((domain) => (
            <CustomDomainPanel
              domain={domain}
              disabled={isActionPending}
              key={domain.id}
              onCopy={copy}
              onDelete={() => runDomainAction(() => adminApi.deleteDomain(domain.id), "Custom domain removed.")}
              onMakePrimary={() => runDomainAction(() => adminApi.makeDomainPrimary(domain.id), "Primary domain updated.")}
              onVerify={() => runDomainAction(() => adminApi.verifyDomain(domain.id), "Domain status checked.")}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-4">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 break-all font-medium text-primary">{value}</p>
    </div>
  );
}

function CustomDomainPanel({
  domain,
  disabled,
  onCopy,
  onDelete,
  onMakePrimary,
  onVerify
}: {
  domain: CustomDomain;
  disabled: boolean;
  onCopy: (value?: string | null) => void;
  onDelete: () => void;
  onMakePrimary: () => void;
  onVerify: () => void;
}) {
  const ready = domain.is_ready;
  const status = domainStatus(domain);
  return (
    <article className="rounded-md border bg-background p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-all font-semibold text-primary">{domain.hostname}</h3>
            {domain.is_primary ? <span className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">Primary</span> : null}
            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${ready ? "bg-accent/15 text-accent" : "bg-secondary/15 text-secondary"}`}>
              {ready ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              {status.label}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{status.description}</p>
          {domain.provider_error ? <p className="mt-2 text-sm text-destructive">{domain.provider_error}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" type="button" onClick={onVerify} disabled={disabled}>
            <RefreshCw size={15} /> Check status
          </Button>
          <Button variant="outline" type="button" onClick={onMakePrimary} disabled={disabled || !ready || domain.is_primary}>
            <Star size={15} /> Make primary
          </Button>
          <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold text-destructive" type="button" onClick={onDelete} disabled={disabled}>
            <Trash2 size={15} /> Remove
          </button>
        </div>
      </div>

      {!domain.is_verified ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <DnsRecord label="Ownership TXT name" value={domain.verification_record_name} onCopy={onCopy} />
          <DnsRecord label="Ownership TXT value" value={domain.verification_record_value} onCopy={onCopy} />
        </div>
      ) : null}
      {domain.provider_verification_record_name && !ready ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <DnsRecord label="Vercel TXT name" value={domain.provider_verification_record_name} onCopy={onCopy} />
          <DnsRecord label="Vercel TXT value" value={domain.provider_verification_record_value} onCopy={onCopy} />
        </div>
      ) : null}
      {!ready && domain.dns_target ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <DnsRecord label={`Website ${domain.dns_record_type ?? "CNAME"} target`} value={domain.dns_target} onCopy={onCopy} />
        </div>
      ) : null}
      {domain.provider_checked_at || domain.last_checked_at ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Last checked {new Date(domain.provider_checked_at ?? domain.last_checked_at ?? "").toLocaleString()}
        </p>
      ) : null}
    </article>
  );
}

function domainStatus(domain: CustomDomain): { label: string; description: string } {
  switch (domain.provisioning_status) {
    case "ready":
      return { label: "Live", description: "The domain is attached to Vercel and ready to serve the website and client portal." };
    case "provisioning":
      return { label: "Provisioning", description: "Ownership is verified. The domain is being attached to the website deployment." };
    case "pending_provider_verification":
      return { label: "Verification needed", description: "Add the Vercel TXT record shown below, then check the status again." };
    case "pending_dns":
      return { label: "Pending website DNS", description: "Point the website DNS record to the target below, then check the status again." };
    case "configuration_required":
      return { label: "Platform setup needed", description: "The platform owner must finish the Vercel API configuration." };
    case "failed":
      return { label: "Needs attention", description: "Vercel could not finish provisioning. Review the message below and retry." };
    default:
      return { label: "Pending ownership", description: "Add the ownership TXT record below, then check the status." };
  }
}

function DnsRecord({ label, value, onCopy }: { label: string; value?: string | null; onCopy: (value?: string | null) => void }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 break-all text-sm text-primary">{value ?? "Not generated"}</code>
        <button className="grid h-8 w-8 shrink-0 place-items-center rounded-md border" type="button" onClick={() => onCopy(value)} aria-label={`Copy ${label}`}>
          <Copy size={14} />
        </button>
      </div>
    </div>
  );
}
