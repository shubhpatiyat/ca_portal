export type HostRouteDecision =
  | { kind: "next" }
  | { kind: "not_found" }
  | { kind: "redirect"; destination: string };

export function normalizeHost(value: string | null | undefined): string {
  const host = (value ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
  if (!host) {
    return "";
  }
  if (host.startsWith("[")) {
    return host.split("]")[0]?.replace("[", "") ?? "";
  }
  return host.split(":")[0] ?? host;
}

export function platformOrigin(value: string | null | undefined): URL | null {
  if (!value) {
    return null;
  }
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function decideHostRoute(
  host: string,
  pathname: string,
  platformUrl: string | null | undefined
): HostRouteDecision {
  const origin = platformOrigin(platformUrl);
  if (!origin) {
    return { kind: "next" };
  }

  const isPlatformHost = normalizeHost(host) === normalizeHost(origin.host);
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminAuthRoute = pathname === "/auth/callback";
  const isClientRoute = pathname === "/client" || pathname.startsWith("/client/");

  if (!isPlatformHost && (isAdminRoute || isAdminAuthRoute)) {
    return {
      kind: "redirect",
      destination: new URL(pathname, origin).toString()
    };
  }

  if (isPlatformHost && pathname === "/") {
    return { kind: "redirect", destination: new URL("/admin/login", origin).toString() };
  }

  if (isPlatformHost && isClientRoute) {
    return { kind: "not_found" };
  }

  return { kind: "next" };
}
