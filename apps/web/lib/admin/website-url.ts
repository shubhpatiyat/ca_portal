function platformBaseForSubdomain(subdomain: string): string {
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ?? "lvh.me:3000";
  const platformScheme = process.env.NEXT_PUBLIC_PLATFORM_SCHEME ?? "http";
  return `${platformScheme}://${subdomain}.${platformDomain}`;
}

export function resolveAdminWebsiteUrl(
  defaultUrl: string | null | undefined,
  organizationSlug: string,
  defaultSubdomain?: string | null
): string {
  const subdomain = defaultSubdomain || organizationSlug;

  if (!defaultUrl) {
    return platformBaseForSubdomain(subdomain);
  }

  try {
    const url = new URL(defaultUrl);
    if (url.hostname.endsWith(".lvh.me") && !url.port) {
      const platformPort = (process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ?? "").split(":")[1];
      if (platformPort) {
        url.port = platformPort;
      }
    }
    return url.toString();
  } catch {
    return defaultUrl;
  }
}
