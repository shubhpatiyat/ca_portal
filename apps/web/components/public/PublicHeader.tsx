"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import type { PublicSitePage } from "@/types/site";
import { brandInitials } from "@/lib/brand";

const sectionNav = [
  { label: "How It Works", sectionId: "how-we-work", pageSlug: "home" },
  { label: "Security", sectionId: "security", pageSlug: "home" },
  { label: "FAQ", sectionId: "faq", pageSlug: "home" }
] as const;

export function PublicHeader({ page, basePath }: { page: PublicSitePage; basePath?: string }) {
  const base = basePath ?? `/s/${page.organization_slug}`;
  const path = (slug: string) => (base ? `${base}/${slug}` : `/${slug}`);
  const homePath = base || "/";
  const initials = brandInitials(page.firm_name);
  const isHomePage = page.page_slug === "home";
  const [activeSection, setActiveSection] = useState<string>(page.page_slug === "home" ? "home" : page.page_slug);
  const nav = useMemo(
    () =>
      sectionNav.map((item) => ({
        ...item,
        href: isHomePage ? `#${item.sectionId}` : item.pageSlug === page.page_slug ? path(item.pageSlug) : `${homePath}#${item.sectionId}`
      })),
    [homePath, isHomePage, page.page_slug]
  );

  useEffect(() => {
    if (!isHomePage) {
      setActiveSection(page.page_slug);
      return;
    }

    const visibleSections = sectionNav.map((item) => item.sectionId).filter((sectionId) => document.getElementById(sectionId));
    if (!visibleSections.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

        if (visibleEntry?.target.id) {
          setActiveSection(visibleEntry.target.id);
        }
      },
      {
        rootMargin: "-28% 0px -58% 0px",
        threshold: [0.08, 0.2, 0.45, 0.7]
      }
    );

    visibleSections.forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [isHomePage, page.page_slug]);

  useEffect(() => {
    if (!isHomePage || !activeSection) {
      return;
    }
    const nextHash = activeSection === "home" ? "" : `#${activeSection}`;
    const nextUrl = `${window.location.pathname}${nextHash}`;
    if (`${window.location.pathname}${window.location.hash}` !== nextUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [activeSection, isHomePage]);

  function handleNavClick(event: MouseEvent<HTMLAnchorElement>, sectionId: string) {
    if (!isHomePage) {
      return;
    }
    const element = document.getElementById(sectionId);
    if (!element) {
      return;
    }
    event.preventDefault();
    element.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(sectionId);
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <nav className="section-shell flex min-h-16 items-center justify-between gap-4 py-2 md:min-h-20" aria-label="Primary">
        <Link className="flex min-w-0 items-center gap-3" href={homePath}>
          <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl border-2 border-secondary bg-primary font-serif text-base font-bold text-primary-foreground">
            {initials}
          </span>
          <span className="truncate font-serif text-2xl font-semibold text-primary">{page.firm_name}</span>
        </Link>
        <div className="hidden items-center gap-6 text-sm font-semibold uppercase tracking-[0.05em] text-muted-foreground md:flex">
          {nav.map((item) => {
            const active = activeSection === item.sectionId || activeSection === item.pageSlug;
            return (
              <Link
                className={`border-b-2 py-2 transition hover:border-secondary hover:text-secondary ${
                  active ? "border-secondary text-secondary" : "border-transparent"
                }`}
                href={item.href}
                key={item.label}
                onClick={(event) => handleNavClick(event, item.sectionId)}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="hidden items-center gap-4 lg:flex">
          <Link className="px-2 py-3 text-sm font-semibold text-muted-foreground transition hover:text-primary" href="/client/login">
            Client Login
          </Link>
          <a className="rounded-lg bg-secondary px-5 py-3 text-sm font-semibold uppercase tracking-[0.05em] text-secondary-foreground shadow-sm transition hover:opacity-90 active:scale-95" href={isHomePage ? "#contact" : `${homePath}#contact`} onClick={(event) => handleNavClick(event, "contact")}>
            Free Consultation
          </a>
        </div>
        <div className="flex items-center gap-3 lg:hidden">
          <Link className="text-xs font-semibold text-muted-foreground" href="/client/login">
            Login
          </Link>
          <a className="rounded-lg bg-secondary px-4 py-3 text-xs font-semibold uppercase tracking-[0.05em] text-secondary-foreground shadow-sm transition hover:opacity-90" href={isHomePage ? "#contact" : `${homePath}#contact`} onClick={(event) => handleNavClick(event, "contact")}>
            Consult
          </a>
        </div>
      </nav>
      <div className="section-shell flex gap-2 overflow-x-auto pb-3 md:hidden">
        {nav.map((item) => {
          const active = activeSection === item.sectionId || activeSection === item.pageSlug;
          return (
            <Link
              className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.05em] transition ${
                active ? "border-secondary bg-secondary text-secondary-foreground" : "border-border bg-background text-muted-foreground"
              }`}
              href={item.href}
              key={item.label}
              onClick={(event) => handleNavClick(event, item.sectionId)}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
