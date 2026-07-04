function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0" || hostname.endsWith(".lvh.me");
}

export function resolveAdminWebsiteUrl(
  defaultUrl: string | null | undefined,
  organizationSlug: string,
  defaultSubdomain?: string | null
): string {
  const subdomain = defaultSubdomain || organizationSlug;
  const pathUrl = `/s/${organizationSlug}`;

  if (typeof window === "undefined") {
    return defaultUrl ?? pathUrl;
  }

  if (!defaultUrl) {
    return isLocalHost(window.location.hostname) ? `http://${subdomain}.lvh.me:${window.location.port || "3000"}` : pathUrl;
  }

  try {
    const url = new URL(defaultUrl);
    if (url.hostname.endsWith(".lvh.me") && !url.port) {
      url.port = window.location.port || "3000";
    }
    if (window.location.hostname.endsWith(".vercel.app") && url.hostname !== window.location.hostname) {
      return pathUrl;
    }
    return url.toString();
  } catch {
    return defaultUrl;
  }
}
