import React, { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { TabId } from "../seo";
import { BRAND_NAME } from "../content/brand";
import { AWARD, AWARD_NAME, AWARD_PERKS, ELIGIBLE_NICHES } from "../content/awards";
import type { ProfileView } from "../lib/profile";
import ProfileCard from "./ProfileCard";
import Photo from "./Photo";
import TabLink from "./TabLink";
import type { RosterStatus } from "./RosterNotice";
import RosterNotice from "./RosterNotice";

interface HomeTabProps {
  profiles: ProfileView[];
  status: RosterStatus;
  onNavigate: (tab: TabId) => void;
  onSelectProfile: (profile: ProfileView) => void;
  onBrandEnquiry: () => void;
  onAwardEnquiry: () => void;
  /** Opens the directory with these filters applied */
  onBrowse: (filters: { q?: string; category?: string; city?: string }) => void;
  onRetry: () => void;
}

const STEPS = [
  { title: "A creator applies", text: "The form asks for their niche, city, audience figures, photos and contact details. Applying is free." },
  { title: "Our team reviews it", text: "We read every application and check the creator's public social profiles before approving it." },
  { title: "The profile is published", text: "Approved creators appear in the directory with what they submitted. We do not add numbers or claims of our own." },
  { title: "Corrections are welcome", text: "Creators can ask us to update or remove their profile at any time through the contact page." }
];

const countBy = (values: string[]) => {
  const map = new Map<string, number>();
  values.filter(Boolean).forEach((v) => map.set(v, (map.get(v) || 0) + 1));
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
};

function HeroSearch({ onBrowse }: { onBrowse: HomeTabProps["onBrowse"] }) {
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      aria-label="Search profiles"
      onSubmit={(e) => {
        e.preventDefault();
        onBrowse({ q: q.trim() });
      }}
      className="flex w-full max-w-xl"
    >
      <label htmlFor="home-search" className="sr-only">Search creator profiles by name, niche or city</label>
      <div className="relative flex-1 min-w-0">
        <Search className="w-4 h-4 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
        <input
          id="home-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name, niche or city"
          autoComplete="off"
          className="h-12 w-full rounded-l-[4px] border border-r-0 border-field bg-surface pl-10 pr-3 text-[1rem] text-ink focus:outline-none focus:border-ink"
        />
      </div>
      <button type="submit" className="btn btn-primary h-12 rounded-l-none">Search</button>
    </form>
  );
}

// Three real profiles, set like a magazine page. Hidden when there are not enough photos.
function HeroComposition({ profiles, onSelectProfile }: { profiles: ProfileView[]; onSelectProfile: HomeTabProps["onSelectProfile"] }) {
  const picks = profiles.filter((p) => p.image).slice(0, 3);
  if (picks.length < 3) return null;
  const [a, b, c] = picks;
  const Item = ({ p, className, ratio }: { p: ProfileView; className: string; ratio: string }) => (
    <figure className={className}>
      <button type="button" onClick={() => onSelectProfile(p)} className="block w-full text-left cursor-pointer group" aria-label={`Open ${p.name}'s profile`}>
        <Photo src={p.image} name={p.name} ratio={ratio} eager className="rounded-[2px]" sizes="(min-width: 1024px) 260px, 40vw" />
        <figcaption className="pt-2 text-[0.8125rem] leading-snug">
          <span className="block font-semibold text-ink group-hover:underline underline-offset-4">{p.name}</span>
          {(p.city || p.category) && <span className="block text-ink-3">{p.city || p.category}</span>}
        </figcaption>
      </button>
    </figure>
  );
  return (
    <div className="hidden lg:grid grid-cols-2 gap-5 items-start" aria-label="Profiles from the directory">
      <Item p={a} className="row-span-2" ratio="aspect-[3/4]" />
      <Item p={b} className="mt-16" ratio="aspect-[4/5]" />
      <Item p={c} className="col-start-2 -mt-2" ratio="aspect-[4/3]" />
    </div>
  );
}

export default function HomeTab({ profiles, status, onNavigate, onSelectProfile, onBrandEnquiry, onAwardEnquiry, onBrowse, onRetry }: HomeTabProps) {
  const featured = profiles.slice(0, 8);
  const categories = useMemo(() => countBy(profiles.map((p) => p.category)), [profiles]);
  const cities = useMemo(() => countBy(profiles.map((p) => p.city)).slice(0, 10), [profiles]);
  const hasComposition = profiles.filter((p) => p.image).length >= 3;

  return (
    <div className="pb-8">
      {/* Introduction */}
      <section className="page pt-10 md:pt-16 pb-14 md:pb-20">
        <div className={`grid gap-12 items-center ${hasComposition ? "lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]" : ""}`}>
          <div className="space-y-6 max-w-2xl">
            <p className="eyebrow">Creator directory · India</p>
            <h1 className="display text-[2.375rem] leading-[1.08] md:text-[3.25rem]">
              Indian creators, reviewed by our team before they are listed
            </h1>
            <p className="lede max-w-xl">
              {BRAND_NAME} is a public directory of creators from across India. Any creator can apply for a free profile, which
              goes live once our team approves it. Brands browse by niche and city, then send us an enquiry.
            </p>
            <HeroSearch onBrowse={onBrowse} />
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
              <TabLink tab="directory" onNavigate={onNavigate} className="link inline-flex items-center gap-1.5">
                Or browse all profiles <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </TabLink>
            </div>
          </div>
          <HeroComposition profiles={profiles} onSelectProfile={onSelectProfile} />
        </div>
      </section>

      {/* Who the site is for: one clear path each for creators and brands */}
      <section aria-label="Ways to use the site" className="border-y border-line bg-surface">
        <div className="page grid md:grid-cols-2 md:divide-x divide-y md:divide-y-0 divide-line">
          <div className="py-8 md:py-10 md:pr-10 space-y-3">
            <h2 className="eyebrow">For creators</h2>
            <p className="font-display text-[1.5rem] leading-snug text-ink">Get a free public profile that brands can find.</p>
            <p className="text-ink-2">
              Apply in about two minutes. Our team reviews each application before it is published, and you can ask for changes at any time.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
              <TabLink tab="apply" onNavigate={onNavigate} className="btn btn-primary">Join as a creator</TabLink>
              <TabLink tab="membership" onNavigate={onNavigate} className="link">Membership plans</TabLink>
            </div>
          </div>
          <div className="py-8 md:py-10 md:pl-10 space-y-3">
            <h2 className="eyebrow">For brands</h2>
            <p className="font-display text-[1.5rem] leading-snug text-ink">Find creators for a campaign.</p>
            <p className="text-ink-2">
              Tell us your brief, budget and timeline. Our team suggests creators from the directory and puts you in touch.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
              <button type="button" onClick={onBrandEnquiry} className="btn btn-secondary">Send a brand enquiry</button>
              <TabLink tab="campaigns" onNavigate={onNavigate} className="link">Open campaigns</TabLink>
            </div>
          </div>
        </div>
      </section>

      {/* Profiles */}
      <section aria-labelledby="home-profiles" className="page py-14 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 id="home-profiles" className="h-section">In the directory</h2>
            <p className="text-ink-2">
              {status === "loading" ? "Loading profiles…" : `${profiles.length} published ${profiles.length === 1 ? "profile" : "profiles"}. Open one to see their work.`}
            </p>
          </div>
          <TabLink tab="directory" onNavigate={onNavigate} className="link inline-flex items-center gap-1.5">
            See all profiles <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </TabLink>
        </div>
        <RosterNotice status={status} onRetry={onRetry} className="mt-6" />
        {featured.length > 0 && (
          <ul className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
            {featured.map((p) => (
              <li key={p.slug}>
                <ProfileCard profile={p} onOpen={onSelectProfile} />
              </li>
            ))}
          </ul>
        )}

        {(categories.length > 0 || cities.length > 0) && (
          <div className="mt-14 grid gap-10 md:grid-cols-2">
            {categories.length > 0 && (
              <nav aria-labelledby="browse-category">
                <h3 id="browse-category" className="label-caps pb-3 border-b border-line">Browse by category</h3>
                <ul className="divide-y divide-line">
                  {categories.map(([name, n]) => (
                    <li key={name}>
                      <a
                        href={`/talent/?category=${encodeURIComponent(name)}`}
                        onClick={(e) => {
                          if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                          e.preventDefault();
                          onBrowse({ category: name });
                        }}
                        className="flex items-baseline justify-between gap-4 py-3 text-ink hover:text-bronze"
                      >
                        <span className="font-display text-[1.1875rem]">{name}</span>
                        <span className="text-[0.875rem] text-ink-3 tabular-nums">{n}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            {cities.length > 0 && (
              <nav aria-labelledby="browse-city">
                <h3 id="browse-city" className="label-caps pb-3 border-b border-line">Browse by city</h3>
                <ul className="divide-y divide-line">
                  {cities.map(([name, n]) => (
                    <li key={name}>
                      <a
                        href={`/talent/?city=${encodeURIComponent(name)}`}
                        onClick={(e) => {
                          if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                          e.preventDefault();
                          onBrowse({ city: name });
                        }}
                        className="flex items-baseline justify-between gap-4 py-3 text-ink hover:text-bronze"
                      >
                        <span className="font-display text-[1.1875rem]">{name}</span>
                        <span className="text-[0.875rem] text-ink-3 tabular-nums">{n}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        )}
      </section>

      {/* How profiles are published */}
      <section aria-labelledby="how-profiles" className="bg-surface border-y border-line">
        <div className="page py-14 md:py-20 grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
          <div className="space-y-3">
            <h2 id="how-profiles" className="h-section">How a profile gets here</h2>
            <p className="text-ink-2">
              Profiles marked <strong className="font-semibold text-ink">Reviewed</strong> were approved by our team. Follower and engagement
              figures come from the creator and are not independently audited.
            </p>
            <TabLink tab="faq" onNavigate={onNavigate} className="link inline-block">Read the full answer</TabLink>
          </div>
          <ol className="grid sm:grid-cols-2 gap-x-10 border-t border-ink">
            {STEPS.map((s, i) => (
              <li key={s.title} className="py-6 border-b border-line space-y-2">
                <span className="font-display text-[1.5rem] text-bronze tabular-nums" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-semibold text-ink">{s.title}</h3>
                <p className="text-[0.9375rem] leading-relaxed text-ink-2">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* The award */}
      <section aria-labelledby="the-award" className="page py-14 md:py-20">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="eyebrow">The award</p>
            <h2 id="the-award" className="h-section">{AWARD.name}</h2>
            <p className="lede">{AWARD.text}</p>
            <p className="text-[0.9375rem] text-ink-2">
              Open to creators in {ELIGIBLE_NICHES.slice(0, -1).join(", ").toLowerCase()} and {ELIGIBLE_NICHES[ELIGIBLE_NICHES.length - 1].toLowerCase()}, among other niches.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button type="button" onClick={onAwardEnquiry} className="btn btn-primary">Ask about the award</button>
              <TabLink tab="apply" onNavigate={onNavigate} className="btn btn-secondary">Join as a creator</TabLink>
            </div>
          </div>
          <dl className="border-t border-line">
            {AWARD_PERKS.map((perk) => (
              <div key={perk.title} className="grid sm:grid-cols-[12rem_1fr] gap-1 sm:gap-6 py-5 border-b border-line">
                <dt className="font-semibold text-ink">{perk.title}</dt>
                <dd className="text-ink-2">{perk.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* The rest of the site */}
      <section aria-labelledby="more-on-site" className="page pb-6">
        <div className="border-t border-line pt-12 grid gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
          <h2 id="more-on-site" className="h-section">Also on the site</h2>
          <ul className="grid sm:grid-cols-2 gap-x-10 border-t border-line sm:border-t-0">
            {[
              { tab: "starindia" as TabId, title: "Star India", text: "The creator membership: a public profile, branding help and brand introductions." },
              { tab: "greenlight" as TabId, title: "Guides and Explore Magazine", text: "Practical guides for creators and brands, and magazine feature bookings." },
              { tab: "faq" as TabId, title: "Questions and answers", text: "How reviews work, what profiles show and how to change yours." },
              { tab: "catwalk" as TabId, title: "3D gallery", text: "The same profiles, arranged in an interactive 3D space." }
            ].map((item) => (
              <li key={item.tab} className="border-b border-line sm:border-t sm:[&:nth-child(n+3)]:border-t-0">
                <TabLink tab={item.tab} onNavigate={onNavigate} className="group flex items-start justify-between gap-6 py-4">
                  <span>
                    <span className="block font-semibold text-ink group-hover:underline underline-offset-4">{item.title}</span>
                    <span className="block text-[0.9375rem] text-ink-2">{item.text}</span>
                  </span>
                  <ArrowRight className="w-4 h-4 mt-1 shrink-0 text-ink-3 group-hover:text-ink" aria-hidden="true" />
                </TabLink>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
