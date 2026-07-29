import { unstable_cache } from "next/cache";
import type { LeadPayload, PublicSitePage } from "@/types/site";
import { pageFromSlug } from "@/lib/demo-site";

const apiBaseUrl = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL;
const shouldCachePublicPages = process.env.NODE_ENV === "production";

export function normalizePublicHost(host: string | null | undefined): string {
  const value = (host ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
  if (!value) {
    return "";
  }
  if (value.startsWith("[")) {
    return value.split("]")[0]?.replace("[", "") ?? "";
  }
  return value.split(":")[0] ?? value;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function publicPageCacheKey(scope: string, pageSlug: string) {
  return [`public-page:${scope}:${pageSlug}`];
}

export function getPublicPage(organizationSlug: string, pageSlug: string): Promise<PublicSitePage> {
  const normalizedPageSlug = pageSlug || "home";
  const loadPage = async () => {
    if (!apiBaseUrl) {
      return pageFromSlug(normalizedPageSlug);
    }

    return fetchJson<PublicSitePage>(
      `${apiBaseUrl}/api/v1/public/sites/by-slug/${organizationSlug}/pages/${normalizedPageSlug}`
    );
  };

  if (!shouldCachePublicPages) {
    return loadPage();
  }

  return unstable_cache(
    loadPage,
    publicPageCacheKey(organizationSlug, normalizedPageSlug),
    {
      revalidate: 3600,
      tags: [`tenant:${organizationSlug}`, `page:${organizationSlug}:${normalizedPageSlug}`]
    }
  )();
}

export function getPublicPageByHost(host: string, pageSlug: string): Promise<PublicSitePage> {
  const normalizedHost = normalizePublicHost(host);
  const normalizedPageSlug = pageSlug || "home";
  const loadPage = async () => {
    if (!apiBaseUrl) {
      return pageFromSlug(normalizedPageSlug);
    }

    return fetchJson<PublicSitePage>(
      `${apiBaseUrl}/api/v1/public/sites/by-host/pages/${normalizedPageSlug}?hostname=${encodeURIComponent(normalizedHost)}`,
      {
        headers: {
          "x-site-host": normalizedHost
        }
      }
    );
  };

  if (!shouldCachePublicPages) {
    return loadPage();
  }

  return unstable_cache(
    loadPage,
    publicPageCacheKey(`host:${normalizedHost}`, normalizedPageSlug),
    {
      revalidate: 300,
      tags: [`host:${normalizedHost}`, `page-host:${normalizedHost}:${normalizedPageSlug}`]
    }
  )();
}

export async function submitLead(payload: LeadPayload): Promise<{ id: string; status: string }> {
  const leadApiBaseUrl = typeof window === "undefined" ? apiBaseUrl : "/backend";
  if (!leadApiBaseUrl) {
    return { id: crypto.randomUUID(), status: "new" };
  }

  return fetchJson<{ id: string; status: string }>(`${leadApiBaseUrl}/api/v1/public/leads`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export type PublicAnalyticsEvent = {
  organization_slug: string;
  event_type: "page_view" | "phone_click" | "whatsapp_click" | "email_click";
  page_slug: string;
  hostname: string;
  session_id: string;
};

export function trackPublicEvent(payload: PublicAnalyticsEvent): void {
  if (typeof window === "undefined") {
    return;
  }
  const body = JSON.stringify(payload);
  const endpoint = "/backend/api/v1/public/analytics/events";
  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
    return;
  }
  void fetch(endpoint, {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
    keepalive: true
  }).catch(() => undefined);
}
