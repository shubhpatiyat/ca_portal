function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0" || hostname.endsWith(".lvh.me");
}

export function resolveAdminWebsiteUrl(
  defaultUrl: string | null | undefined,
  organizationSlug: string,
  defaultSubdomain?: string | null
): string {
  const subdomain = defaultSubdomain || organizationSlug;

  if (typeof window === "undefined") {
    return defaultUrl ?? `https://${subdomain}`;
  }

  if (!defaultUrl) {
    if (isLocalHost(window.location.hostname)) {
      return `http://${subdomain}.lvh.me:${window.location.port || "3000"}`;
    }
    return `https://${subdomain}`;
  }

  try {
    const url = new URL(defaultUrl);
    if (url.hostname.endsWith(".lvh.me") && !url.port) {
      url.port = window.location.port || "3000";
    }
    return url.toString();
  } catch {
    return defaultUrl;
  }
}
