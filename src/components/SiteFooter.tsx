import React from "react";
import { routeForTab, TabId } from "../seo";
import { BRAND_NAME, BRAND_DOMAIN } from "../content/brand";

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
      { label: "Join as a creator", tab: "apply" },
      { label: "Open campaigns", tab: "campaigns" },
      { label: "Membership plans", tab: "membership" },
      { label: "Guides and magazine", tab: "greenlight" }
    ]
  },
  {
    title: "Help",
    links: [
      { label: "Questions and answers", tab: "faq" },
      { label: "Contact us", tab: "contact" },
      { label: "Brand enquiry", action: "enquiry" }
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
    <footer className="surface-dark bg-[#1B1A17] text-[#E7E3DA] mt-16">
      <div className="page py-12 md:py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,4fr)_repeat(3,minmax(0,2fr))]">
        <div className="space-y-3 max-w-sm">
          <p className="font-display text-[1.375rem] text-white">{BRAND_NAME}</p>
          <p className="text-[0.9375rem] leading-relaxed text-[#CFCAC0]">
            A directory of creator profiles from across India, open to any creator. Every profile is reviewed by our team before it is published.
          </p>
          <p className="text-[0.875rem] text-[#CFCAC0]">{BRAND_DOMAIN}</p>
        </div>
        {GROUPS.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <p className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-[#B9B3A6] mb-3">{group.title}</p>
            <ul className="space-y-2.5">
              {group.links.map((item) => (
                <li key={item.label}>
                  <FooterLink item={item} onNavigate={onNavigate} onBrandEnquiry={onBrandEnquiry} />
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/15">
        <div className="page py-5 flex flex-col sm:flex-row gap-2 justify-between text-[0.8125rem] text-[#B9B3A6]">
          <p>{footerText}</p>
          <p>Profile details are supplied by creators. To correct one, use the contact page.</p>
        </div>
      </div>
    </footer>
  );
}
