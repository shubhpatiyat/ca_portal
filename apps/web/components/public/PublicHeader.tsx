import Link from "next/link";
import type { PublicSitePage } from "@/types/site";
import { brandInitials } from "@/lib/brand";

export function PublicHeader({ page, basePath }: { page: PublicSitePage; basePath?: string }) {
  const base = basePath ?? `/s/${page.organization_slug}`;
  const path = (slug: string) => (base ? `${base}/${slug}` : `/${slug}`);
  const initials = brandInitials(page.firm_name);
  const nav = [
    ["Home", base || "/"],
    ["Services", path("services")],
    ["About", `${base || ""}#about`],
    ["Security", `${base || ""}#security`],
    ["Contact", `${base || ""}#contact`]
  ] as const;

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <nav className="section-shell flex h-20 items-center justify-between gap-4" aria-label="Primary">
        <Link className="flex min-w-0 items-center gap-3" href={base || "/"}>
          <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl border-2 border-secondary bg-primary font-serif text-base font-bold text-primary-foreground">
            {initials}
          </span>
          <span className="truncate font-serif text-2xl font-semibold text-primary">{page.firm_name}</span>
        </Link>
        <div className="hidden items-center gap-8 text-sm font-semibold uppercase tracking-[0.05em] text-muted-foreground md:flex">
          {nav.map(([label, href]) => (
            <Link className="border-b-2 border-transparent py-2 transition hover:border-secondary hover:text-secondary" href={href} key={label}>
              {label}
            </Link>
          ))}
        </div>
        <a className="rounded-lg bg-secondary px-5 py-3 text-sm font-semibold uppercase tracking-[0.05em] text-secondary-foreground shadow-sm transition hover:opacity-90 active:scale-95" href="#contact">
          Book a Consultation
        </a>
      </nav>
    </header>
  );
}
