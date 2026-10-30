import { getBrandLogo } from "../lib/siteContent";
import BrandSocialLinks from "./BrandSocialLinks";
import React from "react";
import { routeForTab, TabId, isHiddenTab } from "../seo";
import { BRAND_NAME } from "../content/brand";
import { APPLY_LABEL } from "../content/awards";
import { ORGANISER, ANTI_FRAUD_NOTE } from "../content/organiser";

interface SiteFooterProps {
  footerText: string;
  onNavigate: (tab: TabId) => void;
  onBrandEnquiry: () => void;
}

type FooterLinkItem = { label: string; tab?: TabId; action?: "enquiry" };

const GROUPS: { title: string; links: FooterLinkItem[] }[] = [
  {
    title: "Directory",
    links: [
      { label: "Creator profiles", tab: "directory" },
      { label: "Star India members", tab: "starindia" },
      { label: "3D gallery", tab: "catwalk" }
    ]
  },
  {
    title: "For creators",
    links: [
      { label: APPLY_LABEL, tab: "apply" },
      { label: "The award", tab: "awards" },
      { label: "How joining works", tab: "forcreators" },
      { label: "Membership plans", tab: "membership" },
      { label: "Open campaigns", tab: "campaigns" }
    ]
  },
  {
    title: "For brands",
    links: [
      { label: "Brand enquiry", action: "enquiry" },
      { label: "How it works for brands", tab: "forbrands" },
      { label: "Browse by category", tab: "categories" },
      { label: "Guides and magazine", tab: "greenlight" }
    ]
  },
  {
    title: "Help",
    links: [
      { label: "Questions and answers", tab: "faq" },
      { label: "Contact us", tab: "contact" },
      { label: "Privacy notice", tab: "privacy" }
    ]
  }
];

// Real <a href> links so crawlers can follow them; clicks stay in the single-page app.
function FooterLink({ item, onNavigate, onBrandEnquiry }: { item: FooterLinkItem; onNavigate: (tab: TabId) => void; onBrandEnquiry: () => void }) {
  const className = "text-[0.9375rem] text-[#E7E3DA] hover:text-white underline-offset-4 hover:underline";
  if (item.action === "enquiry") {
    return (
      <button type="button" onClick={onBrandEnquiry} className={`${className} cursor-pointer text-left`}>
        {item.label}
      </button>
    );
  }
  const tab = item.tab!;
  return (
    <a
      href={routeForTab(tab).path}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        onNavigate(tab);
      }}
      className={className}
    >
      {item.label}
    </a>
  );
}

export default function SiteFooter({ footerText, onNavigate, onBrandEnquiry }: SiteFooterProps) {
  return (
    <footer data-site-chrome className="surface-dark bg-[#1B1A17] text-[#E7E3DA]">
      <div className="page py-12 md:py-16 grid gap-x-8 gap-y-10 grid-cols-2 lg:grid-cols-[minmax(0,4fr)_repeat(4,minmax(0,2fr))]">
        <div className="col-span-2 lg:col-span-1 space-y-3 max-w-sm">
          <p className="flex items-center gap-2.5 font-display text-[1.375rem] text-white">{getBrandLogo().url ? <img src={getBrandLogo().url} alt="" className="h-8 w-auto max-w-[180px] object-contain" /> : <img src="/favicon.svg" alt="" width={28} height={28} className="w-7 h-7 rounded-[6px]" />}{!getBrandLogo().hidesName && BRAND_NAME}</p>
          <p className="text-[0.9375rem] leading-relaxed text-[#CFCAC0]">
            A directory of creator profiles from across India. Creators join by applying for the award, and every profile is reviewed by our team before it is published.
          </p>
          <p className="text-[0.875rem] text-[#CFCAC0]">Run by {ORGANISER.name}, {ORGANISER.location}.</p>
          <address className="not-italic text-[0.9375rem] space-y-1.5 pt-1">
            <a href={`mailto:${ORGANISER.email}`} className="block text-white underline-offset-4 hover:underline">{ORGANISER.email}</a>
            <a href={ORGANISER.phoneHref} className="block text-white underline-offset-4 hover:underline">{ORGANISER.phoneDisplay}</a>
            <a href={ORGANISER.whatsappHref} target="_blank" rel="noopener noreferrer" className="block text-[#E7E3DA] underline-offset-4 hover:underline">WhatsApp us</a>
          </address>
          <BrandSocialLinks place="footer" className="pt-2 -ml-2" />
        </div>
        {GROUPS.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.06em] text-[#C9C3B6] mb-3.5">{group.title}</p>
            <ul className="space-y-3">
              {group.links.filter((item) => !item.tab || !isHiddenTab(item.tab)).map((item) => (
                <li key={item.label}>
                  <FooterLink item={item} onNavigate={onNavigate} onBrandEnquiry={onBrandEnquiry} />
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/15">
        <div className="page py-5 flex flex-col sm:flex-row gap-2 justify-between text-[0.875rem] text-[#C9C3B6]">
          <p>{footerText}</p>
          <p className="max-w-2xl sm:text-right">{ANTI_FRAUD_NOTE}</p>
        </div>
      </div>
    </footer>
  );
}
