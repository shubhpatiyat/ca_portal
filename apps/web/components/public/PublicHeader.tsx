"use client";

import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useMemo, useState, type MouseEvent } from "react";
import type { PublicSitePage } from "@/types/site";

const sectionNav = [
  { label: "About Us", sectionId: "about" },
  { label: "How It Works", sectionId: "how-we-work" },
  { label: "Data Security", sectionId: "security" },
  { label: "FAQ", sectionId: "faq" }
] as const;

export function PublicHeader({ page, basePath }: { page: PublicSitePage; basePath?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const base = basePath ?? `/s/${page.organization_slug}`;
  const homePath = base || "/";
  const isHomePage = page.page_slug === "home";
  const nav = useMemo(
    () =>
      sectionNav.map((item) => ({
        ...item,
        href: isHomePage ? `#${item.sectionId}` : `${homePath}#${item.sectionId}`
      })),
    [homePath, isHomePage]
  );

  function handleNavClick(event: MouseEvent<HTMLAnchorElement>, sectionId: string) {
    setMenuOpen(false);
    if (!isHomePage) return;
    const element = document.getElementById(sectionId);
    if (!element) return;
    event.preventDefault();
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <nav
        className="pointer-events-auto mx-auto max-w-[1120px] rounded-[22px] border border-[#d8e2ec]/90 bg-[#f7fafc]/90 px-4 py-3 shadow-[0_12px_40px_rgba(11,31,51,0.08)] backdrop-blur-xl sm:px-5"
        aria-label="Primary navigation"
      >
        <div className="flex items-center justify-between gap-5">
          <Link
            className="min-w-0 truncate text-base font-extrabold tracking-[-0.02em] text-[#0b1f33] sm:text-lg"
            href={homePath}
            onClick={() => setMenuOpen(false)}
          >
            {page.firm_name}
          </Link>

          <div className="hidden items-center gap-7 lg:flex">
            {nav.map((item) => (
              <Link
                className="text-sm font-medium text-[#516173] transition hover:text-[#0e7cff]"
                href={item.href}
                key={item.label}
                onClick={(event) => handleNavClick(event, item.sectionId)}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-4 sm:flex">
            <Link
              className="text-sm font-semibold text-[#516173] transition hover:text-[#0e7cff]"
              href="/client/login"
            >
              Sign in
            </Link>
            <a
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0e7cff] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(14,124,255,0.24)] transition hover:-translate-y-0.5 hover:bg-[#0872ec]"
              href={isHomePage ? "#contact" : `${homePath}#contact`}
              onClick={(event) => handleNavClick(event, "contact")}
            >
              Book a consultation
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>

          <button
            className="grid h-10 w-10 place-items-center rounded-full border border-[#d8e2ec] bg-white text-[#0b1f33] sm:hidden"
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>

        {menuOpen ? (
          <div className="mt-4 grid gap-1 border-t border-[#d8e2ec] pt-3 sm:hidden">
            {nav.map((item) => (
              <Link
                className="rounded-xl px-3 py-3 text-sm font-semibold text-[#516173] transition hover:bg-[#eef5fb] hover:text-[#0e7cff]"
                href={item.href}
                key={item.label}
                onClick={(event) => handleNavClick(event, item.sectionId)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link
                className="grid min-h-11 place-items-center rounded-full border border-[#d8e2ec] bg-white text-sm font-bold text-[#0b1f33]"
                href="/client/login"
              >
                Sign in
              </Link>
              <a
                className="inline-flex min-h-11 items-center justify-center gap-1 rounded-full bg-[#0e7cff] px-4 text-sm font-bold text-white"
                href={isHomePage ? "#contact" : `${homePath}#contact`}
                onClick={(event) => handleNavClick(event, "contact")}
              >
                Book
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  );
}
