"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Home,
  Inbox,
  LayoutDashboard,
  MessageSquareQuote,
  Palette,
  CircleHelp,
  Settings,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api/admin";

const navItems = [
  { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "My Website", href: "/admin/website", icon: Home },
  { label: "Services", href: "/admin/services", icon: BriefcaseBusiness },
  { label: "Client Reviews", href: "/admin/reviews", icon: MessageSquareQuote },
  { label: "FAQs", href: "/admin/faqs", icon: CircleHelp },
  { label: "Contact Details", href: "/admin/contact-details", icon: Building2 },
  { label: "Branding", href: "/admin/branding", icon: Palette },
  { label: "Leads", href: "/admin/leads", icon: Inbox },
  { label: "Website History", href: "/admin/history", icon: BadgeCheck },
  { label: "Settings", href: "/admin/settings", icon: Settings }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthScreen = pathname === "/admin/login" || pathname === "/admin/register";
  const isSetupRoute = pathname === "/admin/onboarding";
  const meQuery = useQuery({
    queryKey: ["admin-me"],
    queryFn: adminApi.me,
    retry: false,
    enabled: !isAuthScreen && !isSetupRoute
  });

  if (isAuthScreen) {
    return <div className="admin-shell min-h-screen p-4">{children}</div>;
  }

  async function signOut() {
    await adminApi.signOut();
    router.push("/admin/login");
  }

  const organization = meQuery.data?.organization;
  const firmName = organization?.name ?? "Firm workspace";
  const firmSlug = organization?.slug ?? "sharma-associates";
  const websiteUrl = organization?.default_url ?? `/s/${firmSlug}`;

  return (
    <div className="admin-shell grid min-h-screen lg:grid-cols-[260px_1fr]">
      <aside className="border-r bg-card">
        <div className="sticky top-0 flex min-h-screen flex-col p-4">
          <Link className="mb-6 flex items-center gap-3 rounded-lg px-2 py-3 font-serif text-xl font-bold text-primary" href="/admin/dashboard">
            <Sparkles size={22} aria-hidden="true" />
            CA Site Platform
          </Link>
          <nav className="grid gap-1" aria-label="Admin">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  className={cn(
                    "flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                    active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <Icon size={18} aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto rounded-lg border bg-background p-3 text-sm text-muted-foreground">
            Drafts stay private until an owner publishes changes.
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="border-b bg-background/90 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 md:px-8">
            <div>
              <p className="text-sm text-muted-foreground">{meQuery.isLoading ? "Loading firm..." : firmName}</p>
              <h1 className="font-semibold text-primary">Firm website workspace</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link className="rounded-md border bg-card px-4 py-2 text-sm font-semibold" href={websiteUrl} target="_blank">
                View Website
              </Link>
              <button className="rounded-md border bg-card px-4 py-2 text-sm font-semibold" type="button" onClick={signOut}>
                Sign out
              </button>
            </div>
          </div>
        </header>
        <main className="p-4 md:p-8">
          {meQuery.isError && !isSetupRoute ? (
            <div className="mb-6 rounded-lg border border-secondary/30 bg-secondary/10 p-4">
              <h1 className="font-semibold text-primary">CMS is open in read-first mode</h1>
              <p className="mt-2 text-muted-foreground">
                I could not verify your admin membership, so content is loaded from the public site where possible. Save and publish need
                Supabase login or local dev auth.
              </p>
              <Link className="mt-3 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" href={`/admin/login?next=${pathname}`}>
                Go to sign in
              </Link>
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
