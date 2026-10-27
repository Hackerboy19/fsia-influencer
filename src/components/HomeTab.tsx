import React, { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { TabId } from "../seo";
import { BRAND_NAME } from "../content/brand";
import { APPLY_LABEL, AWARD, AWARD_NAME, AWARD_BENEFITS, ELIGIBLE_NICHES } from "../content/awards";
import type { ProfileView } from "../lib/profile";
import { profileHref } from "../lib/profileLink";
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

// Only what the application workflow actually does (see ModelRegistrationTab and server approve step)
const CREATOR_STEPS = [
  { title: "Fill in the application", text: "Niche, city, audience figures, a photo and contact details. It is free and takes about two minutes." },
  { title: "Get a reference number", text: "You see it straight away. Your email and mobile are used only to contact you and are never published." },
  { title: "Our team reviews it", text: "We read the application and look at your public social profiles. We contact you by email or WhatsApp." },
  { title: "Your profile goes live", text: "If approved, your profile is published in the directory, and you can apply for open brand campaigns." }
];

const BRAND_STEPS = [
  { title: "Send an enquiry", text: "Your brief, budget, timeline and, if you have one, the creator you want to work with." },
  { title: "We suggest creators", text: "Our team reads every enquiry and replies by email or phone with creators from the directory who fit." },
  { title: "You agree terms directly", text: "Fees, deliverables and dates are agreed between you and the creator. We do not promise availability or results." }
];

const countBy = (values: string[]) => {
  const map = new Map<string, number>();
  values.filter(Boolean).forEach((v) => map.set(v, (map.get(v) || 0) + 1));
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function HeroSearch({ onBrowse, categories }: { onBrowse: HomeTabProps["onBrowse"]; categories: [string, number][] }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  return (
    <form
      role="search"
      aria-label="Search creator profiles"
      onSubmit={(e) => {
        e.preventDefault();
        onBrowse({ q: q.trim(), category });
      }}
      className="panel p-4 sm:p-5 rounded-[4px]"
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem_auto] sm:items-end">
        <div>
          <label htmlFor="home-search" className="field-label">Search the directory</label>
          <div className="relative">
            <Search className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              id="home-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, niche or city"
              autoComplete="off"
              className="field h-12 pl-9 text-[1rem]"
            />
          </div>
        </div>
        <div>
          <label htmlFor="home-category" className="field-label">Category</label>
          <select id="home-category" value={category} onChange={(e) => setCategory(e.target.value)} className="field h-12" disabled={!categories.length}>
            <option value="">All categories</option>
            {categories.map(([name]) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary h-12 px-6">Search</button>
      </div>
    </form>
  );
}

// One lead portrait and two supporting ones, all real directory profiles with their names.
// Left out when fewer than three profiles have photos.
function HeroProfiles({ profiles, sample, onSelectProfile }: { profiles: ProfileView[]; sample: boolean; onSelectProfile: HomeTabProps["onSelectProfile"] }) {
  const picks = profiles.filter((p) => p.image).slice(0, 3);
  if (picks.length < 3) return null;
  const Item = ({ p, lead }: { p: ProfileView; lead?: boolean }) => (
    <a
      href={profileHref(p.slug)}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        onSelectProfile(p);
      }}
      className={`group relative block overflow-hidden rounded-[2px] ${lead ? "row-span-2" : ""}`}
    >
      <Photo src={p.image} name={p.name} eager ratio="h-full" sizes={lead ? "(min-width: 1024px) 340px, 60vw" : "(min-width: 1024px) 220px, 40vw"} />
      <span className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent" aria-hidden="true" />
      <span className="absolute left-3 right-3 bottom-3 text-white">
        <span className={`block font-semibold leading-tight group-hover:underline underline-offset-4 ${lead ? "text-[1.0625rem]" : "text-[0.9375rem]"}`}>{p.name}</span>
        {(p.category || p.city) && <span className="block text-[0.8125rem] text-white/85">{[p.category, p.city].filter(Boolean).join(" · ")}</span>}
      </span>
      {sample && <span className="tag absolute top-2.5 left-2.5">Sample</span>}
    </a>
  );
  return (
    <div className="grid grid-cols-[3fr_2fr] grid-rows-2 gap-3 h-[26rem] sm:h-[32rem] lg:h-[34rem]" aria-label="Profiles from the directory">
      <Item p={picks[0]} lead />
      <Item p={picks[1]} />
      <Item p={picks[2]} />
    </div>
  );
}

export default function HomeTab({ profiles, status, onNavigate, onSelectProfile, onBrandEnquiry, onAwardEnquiry, onBrowse, onRetry }: HomeTabProps) {
  const categories = useMemo(() => countBy(profiles.map((p) => p.category)), [profiles]);
  const cities = useMemo(() => countBy(profiles.map((p) => p.city)), [profiles]);
  const [activeCategory, setActiveCategory] = useState("");
  const sample = status === "sample";

  const inCategory = activeCategory ? profiles.filter((p) => p.category === activeCategory) : profiles;
  const featured = inCategory.slice(0, 9);
  const total = inCategory.length;
  const hasHeroProfiles = profiles.filter((p) => p.image).length >= 3;

  return (
    <div>
      {/* Introduction: what the site is, and the search */}
      <section className="page pt-8 md:pt-14 pb-14 md:pb-20">
        <div className={`grid gap-10 lg:gap-14 items-center ${hasHeroProfiles ? "lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]" : ""}`}>
          <div className="space-y-6 min-w-0">
            <p className="eyebrow">Creator directory · India</p>
            <h1 className="h-hero max-w-[16ch]">
              Find Indian creators, <em>reviewed</em> before they are listed
            </h1>
            <p className="lede max-w-[36rem]">
              Search creator profiles by niche and city. Every profile is submitted by the creator and approved by our team
              before it is published. Brands send enquiries; we reply with creators who fit.
            </p>
            <HeroSearch onBrowse={onBrowse} categories={categories} />
            {status !== "loading" && profiles.length > 0 && (
              <p className="text-[0.9375rem] text-ink-2">
                <span className="font-semibold text-ink">{plural(profiles.length, "profile", "profiles")}</span>
                {categories.length > 0 && <> in {plural(categories.length, "category", "categories")}</>}
                {cities.length > 0 && <>, from {plural(cities.length, "city", "cities")}</>}
                {sample && <span className="text-ink-3"> (sample data on this preview)</span>}.{" "}
                <TabLink tab="directory" onNavigate={onNavigate} className="link whitespace-nowrap">Browse all</TabLink>
              </p>
            )}
          </div>
          {hasHeroProfiles && <HeroProfiles profiles={profiles} sample={sample} onSelectProfile={onSelectProfile} />}
        </div>
      </section>

      {/* Creator discovery: the centrepiece */}
      <section aria-labelledby="home-profiles" className="bg-surface border-y border-line">
        <div className="page section">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="space-y-2 max-w-2xl">
              <p className="eyebrow">In the directory</p>
              <h2 id="home-profiles" className="h-section">Browse creators by niche</h2>
              <p className="text-ink-2">Open a profile to see their work, audience figures and how to enquire.</p>
            </div>
            <TabLink tab="directory" onNavigate={onNavigate} className="btn btn-secondary justify-self-start">
              {status === "loading" ? "All profiles" : `All ${profiles.length} profiles`} <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </TabLink>
          </div>

          {categories.length > 1 && (
            <div className="mt-8 -mx-5 px-5 md:mx-0 md:px-0 overflow-x-auto scrollbar-none">
              <div role="group" aria-label="Show profiles from one category" className="flex gap-2 w-max md:w-auto md:flex-wrap">
                <button type="button" className="chip" aria-pressed={!activeCategory} onClick={() => setActiveCategory("")}>
                  All <span className="count">{profiles.length}</span>
                </button>
                {categories.map(([name, n]) => (
                  <button key={name} type="button" className="chip" aria-pressed={activeCategory === name} onClick={() => setActiveCategory(name)}>
                    {name} <span className="count">{n}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <RosterNotice status={status} onRetry={onRetry} className="mt-6" />

          {status === "loading" ? (
            <ul className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10" aria-hidden="true">
              {Array.from({ length: 8 }).map((_, i) => (
                <li key={i} className="space-y-3">
                  <span className="block aspect-[4/5] bg-sunken" />
                  <span className="block h-4 w-2/3 bg-sunken" />
                  <span className="block h-3 w-1/2 bg-sunken" />
                </li>
              ))}
            </ul>
          ) : featured.length > 0 ? (
            <ul className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10" aria-live="polite">
              {featured.map((p, i) => (
                <li key={p.slug} className={i === 0 && featured.length >= 5 ? "col-span-2 lg:row-span-2" : ""}>
                  <ProfileCard profile={p} onOpen={onSelectProfile} size={i === 0 && featured.length >= 5 ? "feature" : "default"} eager={i < 3} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-8 text-ink-2">No profiles are published yet. Creators appear here once our team approves their application.</p>
          )}

          {status !== "loading" && total > featured.length && (
            <p className="mt-10">
              <a
                href={`/talent/${activeCategory ? `?category=${encodeURIComponent(activeCategory)}` : ""}`}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                  e.preventDefault();
                  onBrowse({ category: activeCategory });
                }}
                className="link inline-flex items-center gap-1.5"
              >
                See all {total} {activeCategory ? `${activeCategory} profiles` : "profiles"} <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </p>
          )}

          {cities.length > 1 && (
            <nav aria-labelledby="browse-city" className="mt-12 pt-6 border-t border-line flex flex-col md:flex-row md:items-baseline gap-3 md:gap-6">
              <h3 id="browse-city" className="label-caps shrink-0">By city</h3>
              <ul className="flex flex-wrap gap-x-5 gap-y-2">
                {cities.map(([name, n]) => (
                  <li key={name}>
                    <a
                      href={`/talent/?city=${encodeURIComponent(name)}`}
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                        e.preventDefault();
                        onBrowse({ city: name });
                      }}
                      className="text-[0.9375rem] text-ink hover:text-bronze underline-offset-4 hover:underline"
                    >
                      {name} <span className="text-ink-3 tabular-nums">{n}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </section>

      {/* For creators: how applying works */}
      <section aria-labelledby="for-creators" className="page section">
        <div className="grid gap-10 lg:gap-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="space-y-4 lg:sticky lg:top-8 self-start">
            <p className="eyebrow">For creators</p>
            <h2 id="for-creators" className="h-section">Join by applying for the {AWARD_NAME}</h2>
            <p className="text-ink-2 max-w-md">
              For now, applying for the award is how creators join {BRAND_NAME}. After the awards, the platform opens to every creator.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
              <TabLink tab="apply" onNavigate={onNavigate} className="btn btn-primary">{APPLY_LABEL}</TabLink>
              <TabLink tab="membership" onNavigate={onNavigate} className="link">Optional membership plans</TabLink>
            </div>
          </div>
          <ol className="relative border-l border-line-strong ml-3 sm:ml-4">
            {CREATOR_STEPS.map((s, i) => (
              <li key={s.title} className="relative pl-8 sm:pl-10 pb-8 last:pb-0">
                <span className="absolute -left-[0.8125rem] top-0 w-[1.625rem] h-[1.625rem] rounded-full bg-paper border border-ink text-[0.8125rem] font-semibold text-ink inline-flex items-center justify-center tabular-nums" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="font-semibold text-[1.0625rem] text-ink leading-tight">{s.title}</h3>
                <p className="mt-1.5 text-ink-2 max-w-xl">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* For brands: the enquiry, on a dark band so it reads as a different path */}
      <section aria-labelledby="for-brands" className="band-ink surface-dark">
        <div className="page section grid gap-10 lg:gap-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="space-y-4">
            <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-champagne">For brands</p>
            <h2 id="for-brands" className="h-section">Tell us the brief. We suggest creators who fit.</h2>
            <p className="text-[#CFCAC0] max-w-md">
              There is no fee to send an enquiry. You can ask about one creator from a profile, or let us suggest several.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button type="button" onClick={onBrandEnquiry} className="btn btn-light">Send a brand enquiry</button>
              <TabLink tab="campaigns" onNavigate={onNavigate} className="btn btn-ghost-light">See open campaigns</TabLink>
            </div>
          </div>
          <ol className="border-t border-white/20">
            {BRAND_STEPS.map((s, i) => (
              <li key={s.title} className="grid grid-cols-[2.5rem_minmax(0,1fr)] sm:grid-cols-[3.5rem_12rem_minmax(0,1fr)] gap-x-4 gap-y-1 py-6 border-b border-white/20">
                <span className="font-display text-[1.75rem] leading-none text-champagne tabular-nums row-span-2 sm:row-span-1" aria-hidden="true">{i + 1}</span>
                <h3 className="font-semibold text-white">{s.title}</h3>
                <p className="text-[0.9375rem] leading-relaxed text-[#CFCAC0]">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* What review means: who supplies what */}
      <section aria-labelledby="how-profiles" className="page section">
        <div className="max-w-2xl space-y-3">
          <p className="eyebrow">How profiles are reviewed</p>
          <h2 id="how-profiles" className="h-section">What “Reviewed” means on a profile</h2>
          <p className="text-ink-2">
            A profile marked Reviewed was read and approved by our team before it was published. It is not an audit of the creator’s audience.
          </p>
        </div>
        <dl className="mt-10 grid md:grid-cols-3 border-t-2 border-ink">
          {[
            { term: "Supplied by the creator", text: "Name, niche, city, bio, photos, follower count and engagement rate. Profiles show these as the creator entered them." },
            { term: "Checked by our team", text: "That the application is complete and that the creator’s public social profiles exist, before we approve it." },
            { term: "Not independently verified", text: "Audience figures. Brands should confirm current numbers with the creator before agreeing a deal." }
          ].map((item, i) => (
            <div key={item.term} className={`py-6 md:pr-8 border-b border-line md:border-b-0 ${i > 0 ? "md:pl-8 md:border-l" : ""}`}>
              <dt className="font-semibold text-ink">{item.term}</dt>
              <dd className="mt-2 text-ink-2">{item.text}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-[0.9375rem] text-ink-2">
          Creators can ask us to correct or remove their profile at any time.{" "}
          <TabLink tab="faq" onNavigate={onNavigate} className="link">Read the FAQ</TabLink>
        </p>
      </section>

      {/* The award: confirmed benefits kept apart from optional services */}
      <section aria-labelledby="the-award" className="bg-sunken border-y border-line">
        <div className="page section grid gap-10 lg:gap-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="space-y-4">
            <p className="eyebrow">The award</p>
            <h2 id="the-award" className="h-section">{AWARD.name}</h2>
            <p className="text-ink-2">{AWARD.text}</p>
            <p className="text-[0.9375rem] text-ink-2">
              <span className="font-semibold text-ink">Niches include</span> {ELIGIBLE_NICHES.slice(0, 6).join(", ").toLowerCase()} and more.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <TabLink tab="apply" onNavigate={onNavigate} className="btn btn-primary">{APPLY_LABEL}</TabLink>
              <button type="button" onClick={onAwardEnquiry} className="btn btn-secondary">Ask about the award</button>
            </div>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            {AWARD_BENEFITS.map((group) => (
              <div key={group.title}>
                <h3 className="label-caps pb-3 border-b border-ink">{group.title}</h3>
                <p className="mt-3 text-[0.875rem] text-ink-3">{group.note}</p>
                <ul className="mt-2 divide-y divide-line">
                  {group.items.map((item) => (
                    <li key={item.title} className="py-4">
                      <p className="font-semibold text-ink">{item.title}</p>
                      <p className="text-[0.9375rem] text-ink-2 mt-0.5">{item.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
