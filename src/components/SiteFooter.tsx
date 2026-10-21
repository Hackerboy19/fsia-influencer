import React from "react";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { routeForTab, TabId } from "../seo";
import { StarLogo } from "./SiteHeader";

interface SiteFooterProps {
  footerText: string;
  onNavigate: (tab: TabId) => void;
  onBrandEnquiry: () => void;
  /** Compact single-row strip for the welcome screen */
  compact?: boolean;
  onBackToTop?: () => void;
}

const GROUPS: { title: string; links: { label: string; tab?: TabId; action?: "enquiry" }[] }[] = [
  {
    title: "For Creators",
    links: [
      { label: "Apply for an Award", tab: "apply" },
      { label: "Star India Profiles", tab: "starindia" },
      { label: "Brand Campaigns", tab: "campaigns" },
      { label: "Membership Plans", tab: "membership" }
    ]
  },
  {
    title: "For Brands",
    links: [
      { label: "Browse Talent", tab: "directory" },
      { label: "3D Awardee Gallery", tab: "catwalk" },
      { label: "Send a Brand Enquiry", action: "enquiry" }
    ]
  },
  {
    title: "Green Light & Help",
    links: [
      { label: "Blog & Magazine", tab: "greenlight" },
      { label: "FAQs", tab: "faq" },
      { label: "Contact", tab: "contact" }
    ]
  }
];

// Real <a href> links so crawlers can follow them; clicks stay in the single-page app.
function FooterLink({
  label,
  tab,
  action,
  onNavigate,
  onBrandEnquiry,
  className
}: {
  label: string;
  tab?: TabId;
  action?: "enquiry";
  onNavigate: (tab: TabId) => void;
  onBrandEnquiry: () => void;
  className: string;
}) {
  const href = tab ? routeForTab(tab).path : "#brand-enquiry";
  return (
    <a
      href={href}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        if (action === "enquiry") onBrandEnquiry();
        else if (tab) onNavigate(tab);
      }}
      className={className}
    >
      {label}
    </a>
  );
}

export default function SiteFooter({ footerText, onNavigate, onBrandEnquiry, compact, onBackToTop }: SiteFooterProps) {
  if (compact) {
    return (
      <footer className="w-full border-t border-black/15 pt-4 flex flex-col md:flex-row items-center justify-between gap-3 text-[12px] font-sans">
        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          {GROUPS.flatMap((g) => g.links).map((link) => (
            <React.Fragment key={link.label}>
              <FooterLink
                {...link}
                onNavigate={onNavigate}
                onBrandEnquiry={onBrandEnquiry}
                className="font-semibold text-[#111] underline-offset-4 decoration-2 hover:underline focus-visible:underline"
              />
            </React.Fragment>
          ))}
        </nav>
        <p className="text-[#2e2c29] font-medium text-center">{footerText}</p>
      </footer>
    );
  }

  return (
    <footer className="surface-dark bg-[#0d111a] text-[#F4F2EE] border-t-4 border-[#d32f2f] -mx-4 md:-mx-8 mt-16 px-6 md:px-12 pt-12 pb-10 rounded-t-3xl">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <StarLogo className="w-10 h-10" />
            <div className="flex flex-col leading-none">
              <p className="font-sans text-xl font-black tracking-tight text-white uppercase">FSIA Influencer</p>
              <p className="text-[10px] font-bold tracking-[0.22em] text-[#ef5350] uppercase mt-1">Influencer Award Agency</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-[#E4E0D8] max-w-xs">
            The influencer award agency for India: awards, Star India profiles, brand deals and the Explore Magazine.
          </p>
          <a
            href="https://influencer.fsia.in/"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#FBBF24] hover:text-white"
          >
            influencer.fsia.in <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>

        {GROUPS.map((group) => (
          <nav key={group.title} aria-label={group.title} className="space-y-3">
            <p className="text-xs font-bold tracking-[0.18em] uppercase text-[#FBBF24]">{group.title}</p>
            <ul className="space-y-2.5">
              {group.links.map((link) => (
                <li key={link.label}>
                  <FooterLink
                    {...link}
                    onNavigate={onNavigate}
                    onBrandEnquiry={onBrandEnquiry}
                    className="text-[15px] text-white/95 hover:text-[#FBBF24] underline-offset-4 hover:underline focus-visible:underline"
                  />
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-[#E4E0D8] text-center sm:text-left">{footerText}</p>
        {onBackToTop && (
          <button
            onClick={onBackToTop}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white border border-white/40 hover:border-white hover:bg-white/10 rounded-full px-4 py-2 cursor-pointer"
          >
            <ArrowUp className="w-4 h-4" /> Back to top
          </button>
        )}
      </div>
    </footer>
  );
}
