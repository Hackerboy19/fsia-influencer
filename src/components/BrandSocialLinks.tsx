import React from "react";
import { Facebook, Globe, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";
import type { SocialId } from "../lib/social";
import { brandSocialList, getSiteExtras } from "../lib/siteExtras";
import { BRAND_NAME } from "../content/brand";

export const SOCIAL_ICONS: Record<SocialId, typeof Globe> = { instagram: Instagram, youtube: Youtube, facebook: Facebook, x: Twitter, linkedin: Linkedin, website: Globe };

/** The brand's own social media icons (Admin → Site settings), for the header or the footer */
export default function BrandSocialLinks({ place, className = "" }: { place: "header" | "footer"; className?: string }) {
  const social = getSiteExtras().social;
  if (!social[place]) return null;
  const links = brandSocialList(social);
  if (!links.length) return null;
  const dark = place === "footer";
  return (
    <ul className={`flex items-center gap-1 ${className}`} aria-label={`${BRAND_NAME} on social media`} data-brand-social={place}>
      {links.map((l) => {
        const Icon = SOCIAL_ICONS[l.id];
        return (
          <li key={l.id}>
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={l.label}
              title={l.label}
              className={`inline-flex items-center justify-center w-9 h-9 rounded-[4px] transition-colors ${
                dark ? "text-[#E7E3DA] hover:text-white hover:bg-white/10" : "text-ink-2 hover:text-ink hover:bg-black/[0.05]"
              }`}
            >
              <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
