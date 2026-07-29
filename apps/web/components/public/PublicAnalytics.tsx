"use client";

import { useEffect } from "react";
import { trackPublicEvent, type PublicAnalyticsEvent } from "@/lib/api/public";
import { randomId } from "@/lib/random-id";
import type { PublicSitePage } from "@/types/site";

const sessionKey = "ca-public-analytics-session";

function analyticsSessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(sessionKey);
    if (existing) {
      return existing;
    }
    const created = randomId();
    window.sessionStorage.setItem(sessionKey, created);
    return created;
  } catch {
    return randomId();
  }
}

function clickEventType(href: string): PublicAnalyticsEvent["event_type"] | null {
  const normalized = href.toLowerCase();
  if (normalized.startsWith("tel:")) {
    return "phone_click";
  }
  if (normalized.startsWith("mailto:")) {
    return "email_click";
  }
  if (normalized.includes("wa.me/") || normalized.includes("whatsapp.com/")) {
    return "whatsapp_click";
  }
  return null;
}

export function PublicAnalytics({ page }: { page: PublicSitePage }) {
  useEffect(() => {
    const sessionId = analyticsSessionId();
    const common = {
      organization_slug: page.organization_slug,
      page_slug: page.page_slug,
      hostname: window.location.hostname,
      session_id: sessionId
    };
    trackPublicEvent({ ...common, event_type: "page_view" });

    function trackClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) {
        return;
      }
      const eventType = clickEventType(anchor.href);
      if (eventType) {
        trackPublicEvent({ ...common, event_type: eventType });
      }
    }

    document.addEventListener("click", trackClick, true);
    return () => document.removeEventListener("click", trackClick, true);
  }, [page.organization_slug, page.page_slug]);

  return null;
}
