import type { PublicSitePage } from "@/types/site";
import { brandInitials } from "@/lib/brand";

export function PublicFooter({ page }: { page: PublicSitePage }) {
  const initials = brandInitials(page.firm_name);

  return (
    <footer className="border-t border-white/10 bg-[#141614] text-[#c7c6c4]">
      <div className="section-shell py-16">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl border-2 border-secondary bg-[#041627] font-serif text-base font-bold text-[#fbf9f4]">
                {initials}
              </span>
              <p className="font-serif text-2xl font-semibold text-[#e3e2e0]">{page.firm_name}</p>
            </div>
            <p className="mt-2 text-sm italic opacity-80">Accurate books, no overhead.</p>
            <p className="mt-5 max-w-md text-sm leading-7 opacity-80">
              Outsourced accounts management for growing businesses: accurate books, on-time payments, and full transparency.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#e3e2e0]">Quick Links</h2>
            <div className="mt-5 grid gap-3 text-sm opacity-80">
              <a className="transition hover:text-white" href="#about">About Us</a>
              <a className="transition hover:text-white" href="#how-we-work">How It Works</a>
              <a className="transition hover:text-white" href="#security">Data Security</a>
              <a className="transition hover:text-white" href="#faq">FAQ</a>
              <a className="transition hover:text-white" href="#contact">Contact Us</a>
              <a className="transition hover:text-white" href="#contact">Careers</a>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#e3e2e0]">Get In Touch</h2>
            <div className="mt-5 grid gap-3 text-sm opacity-80">
              <p>{page.contact.email}</p>
              <p>{page.contact.phone}</p>
              <p>{page.contact.address}</p>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs opacity-70 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {page.firm_name}. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <a className="transition hover:text-white" href="#contact">Privacy Policy</a>
            <a className="transition hover:text-white" href="#contact">Terms of Service</a>
            <a className="transition hover:text-white" href="#security">NDA & Confidentiality Commitment</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
