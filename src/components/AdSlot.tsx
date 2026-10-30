import React from "react";
import { adsFor, type AdPosition, type SiteAd } from "../lib/siteExtras";

// Ad banners set in Admin → Site settings → Ads, at the top or bottom of the chosen pages.
// Each one is marked "Advertisement" and its link is marked sponsored for search engines.
export default function AdSlot({ ads, path, position }: { ads: SiteAd[]; path: string; position: AdPosition }) {
  const list = adsFor(ads, path, position);
  if (!list.length) return null;
  return (
    <aside aria-label="Advertisement" className={`page ${position === "top" ? "pt-6" : "pb-10"} space-y-4`} data-ad-slot={position}>
      {list.map((ad) => {
        const picture = (
          <picture>
            {ad.mobileImage && <source media="(max-width: 640px)" srcSet={ad.mobileImage} />}
            <img src={ad.image} alt={ad.alt} loading={position === "top" ? "eager" : "lazy"} className="w-full h-auto max-h-[320px] object-contain bg-white border border-line" />
          </picture>
        );
        const external = /^https?:\/\//i.test(ad.link);
        return (
          <figure key={ad.id} className="space-y-1" data-ad={ad.id}>
            <figcaption className="text-[0.6875rem] text-ink-3 uppercase tracking-[0.08em]">Advertisement</figcaption>
            {ad.link ? (
              <a href={ad.link} {...(external ? { target: "_blank", rel: "sponsored noopener noreferrer" } : {})} className="block">
                {picture}
              </a>
            ) : (
              picture
            )}
          </figure>
        );
      })}
    </aside>
  );
}
