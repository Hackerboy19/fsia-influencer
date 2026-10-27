import React, { useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Instagram,
  LayoutGrid,
  MapPin,
  Megaphone,
  Search,
  Trophy,
  Users,
  Youtube,
  Gift,
  CircleCheck
} from "lucide-react";
import { TabId } from "../seo";
import { BRAND_NAME } from "../content/brand";
import { APPLY_LABEL, AWARD, AWARD_NAME, AWARD_BENEFITS, ELIGIBLE_NICHES, BLOG_POSTS } from "../content/awards";
import type { ProfileView } from "../lib/profile";
import { profileHref } from "../lib/profileLink";
import Photo from "./Photo";
import TabLink from "./TabLink";
import type { RosterStatus } from "./RosterNotice";
import RosterNotice from "./RosterNotice";
import type { NavTarget } from "./SiteHeader";
import { ORGANISER, APPLICATIONS_OPEN, ANTI_FRAUD_NOTE } from "../content/organiser";

interface HomeTabProps {
  profiles: ProfileView[];
  status: RosterStatus;
  onNavigate: (tab: TabId) => void;
  /** Go to a page or a section on a page */
  onGo: (target: NavTarget) => void;
  onSelectProfile: (profile: ProfileView) => void;
  onBrandEnquiry: () => void;
  onAwardEnquiry: () => void;
  /** Opens the directory with these filters applied */
  onBrowse: (filters: { q?: string; category?: string; city?: string }) => void;
  onRetry: () => void;
  /** Photos saved to the visitor's shortlist (moodboard) */
  moodboardItems?: string[];
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

/** Click handler for a real link that stays in the app on a normal click */
const inApp = (fn: () => void) => (e: React.MouseEvent) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  fn();
};

/** Platforms the creator listed on their profile (self-reported), shown as icons */
function platformsOf(p: ProfileView) {
  const text = p.facts.find((f) => /platform/i.test(f.label))?.value.toLowerCase() || "";
  return { instagram: text.includes("instagram"), youtube: text.includes("youtube") };
}

/* ------------------------------------------------------------------ hero */

function HeroSearch({ onBrowse }: { onBrowse: HomeTabProps["onBrowse"] }) {
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      aria-label="Search creator profiles"
      onSubmit={(e) => {
        e.preventDefault();
        onBrowse({ q: q.trim() });
      }}
      className="flex items-stretch bg-surface border border-line-strong rounded-[4px] p-1.5 shadow-[0_10px_30px_-22px_rgba(27,26,23,.5)] focus-within:border-ink"
    >
      <label htmlFor="home-search" className="sr-only">Search creators by name, niche or city</label>
      <Search className="w-5 h-5 text-ink-3 self-center ml-2.5 shrink-0" aria-hidden="true" />
      <input
        id="home-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search creators by name, niche or city"
        autoComplete="off"
        className="flex-1 min-w-0 bg-transparent px-3 text-[1rem] text-ink outline-none"
      />
      <button type="submit" className="btn btn-primary h-11 px-5 sm:px-7">Search</button>
    </form>
  );
}

function BrandCreatorCards({ onBrandEnquiry, onNavigate, className = "" }: { onBrandEnquiry: () => void; onNavigate: (tab: TabId) => void; className?: string }) {
  return (
    <div className={`grid gap-3 ${className}`}>
      <div className="surface-dark bg-[#1B1A17]/92 text-white p-5 rounded-[4px] border border-white/10">
        <p className="flex items-center gap-2.5 font-semibold text-[1.0625rem]"><Users className="w-5 h-5 text-[#E1C699]" aria-hidden="true" /> For brands</p>
        <p className="mt-1.5 text-[0.9375rem] leading-snug text-[#CFCAC0]">Tell us the brief. We suggest creators from the directory who fit.</p>
        <button type="button" onClick={onBrandEnquiry} className="btn btn-sm btn-light mt-4 w-full">
          Enquire for collaboration <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <div className="surface-dark bg-[#1B1A17]/92 text-white p-5 rounded-[4px] border border-white/10">
        <p className="flex items-center gap-2.5 font-semibold text-[1.0625rem]"><Trophy className="w-5 h-5 text-[#E1C699]" aria-hidden="true" /> For creators</p>
        <p className="mt-1.5 text-[0.9375rem] leading-snug text-[#CFCAC0]">Apply free for the {AWARD_NAME}. Approved creators get a public profile.</p>
        <TabLink tab="apply" onNavigate={onNavigate} className="btn btn-sm btn-primary mt-4 w-full">
          {APPLY_LABEL} <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </TabLink>
      </div>
    </div>
  );
}

function Hero({
  profiles,
  status,
  categories,
  cities,
  onBrowse,
  onNavigate,
  onSelectProfile,
  onBrandEnquiry
}: {
  profiles: ProfileView[];
  status: RosterStatus;
  categories: [string, number][];
  cities: [string, number][];
  onBrowse: HomeTabProps["onBrowse"];
  onNavigate: (tab: TabId) => void;
  onSelectProfile: HomeTabProps["onSelectProfile"];
  onBrandEnquiry: () => void;
}) {
  const sample = status === "sample";
  const withPhoto = profiles.filter((p) => p.image);
  const lead = withPhoto[0];
  const side = withPhoto.slice(1, 4);
  const shortcuts = categories.slice(0, 6);

  const facts: { icon: React.ReactNode; value: string; label: string }[] =
    status === "loading" || !profiles.length
      ? []
      : [
          { icon: <Users className="w-[18px] h-[18px]" />, value: String(profiles.length), label: profiles.length === 1 ? "Profile" : "Profiles" },
          { icon: <LayoutGrid className="w-[18px] h-[18px]" />, value: String(categories.length), label: categories.length === 1 ? "Category" : "Categories" },
          { icon: <MapPin className="w-[18px] h-[18px]" />, value: String(cities.length), label: cities.length === 1 ? "City" : "Cities" }
        ];
  facts.push({ icon: <Gift className="w-[18px] h-[18px]" />, value: "Free", label: "To apply" });
  if (APPLICATIONS_OPEN) facts.push({ icon: <CircleCheck className="w-[18px] h-[18px]" />, value: "Open", label: "Registration" });

  return (
    <section aria-labelledby="home-title" className="relative overflow-hidden bg-ivory border-b border-line">
      {/* Lead portrait: a real directory profile, full-bleed on the right on large screens */}
      {lead && (
        <a
          href={profileHref(lead.slug)}
          onClick={inApp(() => onSelectProfile(lead))}
          className="hidden lg:block absolute inset-y-0 right-0 w-[56%] group"
          aria-label={`${lead.name}${lead.category ? `, ${lead.category}` : ""}: open profile`}
        >
          <Photo src={lead.image} name={lead.name} eager ratio="h-full" className="hero-fade" sizes="(min-width: 1024px) 56vw, 1px" />
        </a>
      )}

      <div className="page-wide relative grid gap-8 lg:grid-cols-[minmax(0,38rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,42rem)_minmax(0,1fr)_17.5rem] pt-8 pb-10 lg:py-11 items-center pointer-events-none [&>*]:pointer-events-auto">
        <div className="min-w-0 space-y-6">
          {/* Phones and tablets: the same real profiles as a short row of portraits */}
          {withPhoto.length >= 3 && (
            <ul className="lg:hidden grid grid-cols-3 gap-2" aria-label="Profiles from the directory">
              {withPhoto.slice(0, 3).map((p) => (
                <li key={p.slug}>
                  <a href={profileHref(p.slug)} onClick={inApp(() => onSelectProfile(p))} className="block relative overflow-hidden rounded-[3px]">
                    <Photo src={p.image} name={p.name} eager ratio="aspect-[3/4]" sizes="33vw" />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-6 text-[0.75rem] font-semibold text-white truncate">{p.name}</span>
                    {sample && <span className="tag absolute top-1.5 left-1.5 !text-[0.6875rem]">Sample</span>}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <h1 id="home-title">
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4">
              <span className="eyebrow tracking-[0.18em]">{AWARD_NAME} · India's creator directory</span>
              {APPLICATIONS_OPEN && (
                <span className="inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold text-[#2f6b45]">
                  <span className="w-2 h-2 rounded-full bg-[#2f6b45]" aria-hidden="true" /> Registration open
                </span>
              )}
            </span>
            <span className="h-display block">
              Discover Creators. <span className="accent">Build Meaningful Collaborations.</span>
            </span>
          </h1>
          <p className="text-[1.0625rem] leading-relaxed text-ink-2 max-w-[34rem]">
            Explore reviewed creator profiles from across India and send us an enquiry to collaborate. Creators join by applying free for the {AWARD_NAME}.
          </p>

          <HeroSearch onBrowse={onBrowse} />

          {shortcuts.length > 0 && (
            <nav aria-label="Category shortcuts" className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-none">
              <ul className="flex gap-2 w-max sm:w-auto sm:flex-wrap">
                <li>
                  <TabLink tab="directory" onNavigate={onNavigate} className="chip !bg-bronze-fill !border-bronze-fill !text-white">
                    <LayoutGrid className="w-4 h-4" aria-hidden="true" /> All
                  </TabLink>
                </li>
                {shortcuts.map(([name]) => (
                  <li key={name}>
                    <a href={`/talent/?category=${encodeURIComponent(name)}`} onClick={inApp(() => onBrowse({ category: name }))} className="chip bg-surface">
                      {name}
                    </a>
                  </li>
                ))}
                {categories.length > shortcuts.length && (
                  <li>
                    <a href="/#categories" onClick={inApp(() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" }))} className="chip bg-surface">
                      More
                    </a>
                  </li>
                )}
              </ul>
            </nav>
          )}

          <ul className="grid grid-cols-2 sm:flex sm:flex-wrap gap-x-7 gap-y-4 pt-1" aria-label="At a glance">
            {facts.map((f) => (
              <li key={f.label} className="flex items-center gap-2.5">
                <span className="icon-dot" aria-hidden="true">{f.icon}</span>
                <span className="leading-tight">
                  <span className="block font-bold text-ink tabular-nums">{f.value}</span>
                  <span className="block text-[0.8125rem] text-ink-3">{f.label}</span>
                </span>
              </li>
            ))}
          </ul>
          {sample && <p className="text-[0.8125rem] text-ink-3">Counts and photos on this preview come from sample profiles.</p>}

          <BrandCreatorCards onBrandEnquiry={onBrandEnquiry} onNavigate={onNavigate} className="sm:grid-cols-2 xl:hidden" />
        </div>

        {/* Supporting portraits, framed like prints, with their real category */}
        <div className="hidden lg:flex flex-col items-end gap-3 self-stretch justify-center pr-2 xl:pr-6">
          {side.map((p, i) => (
            <a
              key={p.slug}
              href={profileHref(p.slug)}
              onClick={inApp(() => onSelectProfile(p))}
              className={`print-frame w-[8.5rem] ${i === 1 ? "-rotate-2 mr-6" : "rotate-2"}`}
              aria-label={`${p.name}${p.category ? `, ${p.category}` : ""}: open profile`}
            >
              <Photo src={p.image} name={p.name} eager ratio="aspect-[5/4]" sizes="136px" />
              <span className="block pt-1.5 text-[0.75rem] font-semibold text-ink truncate">{p.category || p.name}</span>
            </a>
          ))}
          {lead && (
            <p className="mt-2 bg-surface/95 border border-line px-3 py-2 text-[0.8125rem] text-ink-2 rounded-[4px] max-w-[15rem]">
              <span className="block font-semibold text-ink">{lead.name}</span>
              {[lead.category, lead.city].filter(Boolean).join(" · ")}
              {sample && <span className="tag !bg-bronze-soft ml-1.5 align-middle">Sample</span>}
            </p>
          )}
        </div>

        <BrandCreatorCards onBrandEnquiry={onBrandEnquiry} onNavigate={onNavigate} className="hidden xl:grid" />
      </div>
    </section>
  );
}

/* --------------------------------------------------------- feature strip */

function FeatureStrip({ profiles, onGo }: { profiles: ProfileView[]; onGo: HomeTabProps["onGo"] }) {
  const photos = profiles.filter((p) => p.image).map((p) => p.image);
  const items: { title: string; text: string; target: NavTarget; href: string; thumb: React.ReactNode }[] = [
    {
      title: "Discover Creators",
      text: "Search reviewed profiles",
      target: { tab: "directory" },
      href: "/talent/",
      thumb: photos[0] ? <Photo src={photos[0]} name="" eager ratio="h-full w-full" sizes="88px" /> : <Users className="w-6 h-6" />
    },
    {
      title: "3D Gallery",
      text: "Walk through profiles in 3D",
      target: { tab: "catwalk" },
      href: "/gallery/",
      thumb: (
        <span className="mini-3d" aria-hidden="true">
          {[photos[1], photos[2], photos[3]].map((src, i) => (
            <span key={i} style={src ? { backgroundImage: `url("${src}")` } : undefined} />
          ))}
        </span>
      )
    },
    {
      title: "Magazine",
      text: "Guides and magazine features",
      target: { tab: "greenlight" },
      href: "/green-light/",
      thumb: (
        <span className="w-full h-full bg-[#2A251E] text-[#E1C699] flex flex-col items-center justify-center font-display leading-none" aria-hidden="true">
          <span className="text-[0.625rem] tracking-[0.2em] uppercase text-[#CFCAC0]">Green</span>
          <span className="text-[1.25rem] italic">Light</span>
        </span>
      )
    },
    {
      title: "Awards",
      text: APPLICATIONS_OPEN ? "Registration is open" : `The ${AWARD_NAME}`,
      target: { tab: "home", hash: "the-award" },
      href: "/#the-award",
      thumb: (
        <span className="w-full h-full bg-gradient-to-br from-[#2A251E] to-[#4A3A22] text-[#E1C699] flex items-center justify-center" aria-hidden="true">
          <Trophy className="w-7 h-7" />
        </span>
      )
    },
    {
      title: "Campaigns",
      text: "Open brand briefs",
      target: { tab: "campaigns" },
      href: "/campaigns/",
      thumb: (
        <span className="w-full h-full bg-bronze-soft text-bronze flex items-center justify-center" aria-hidden="true">
          <Megaphone className="w-7 h-7" />
        </span>
      )
    }
  ];
  return (
    <nav aria-label="Explore the site" className="page-wide relative z-[1] -mt-px pt-5">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((it) => (
          <li key={it.title}>
            <a href={it.href} onClick={inApp(() => onGo(it.target))} className="card group flex items-center gap-3.5 p-2 pr-3 h-full">
              <span className="w-[5.5rem] lg:w-16 xl:w-[5.5rem] h-16 shrink-0 overflow-hidden rounded-[3px] bg-sunken text-ink-3 flex items-center justify-center">{it.thumb}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink leading-tight lg:text-[0.9375rem] xl:text-[1rem]">{it.title}</span>
                <span className="block text-[0.8125rem] text-ink-3 leading-snug mt-0.5">{it.text}</span>
              </span>
              <ChevronRight className="w-4 h-4 text-ink-3 group-hover:text-ink group-hover:translate-x-0.5 transition-transform shrink-0" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ------------------------------------------------------ featured creators */

function CreatorCard({ p, sample, saved, onOpen }: { p: ProfileView; sample: boolean; saved: boolean; onOpen: (p: ProfileView) => void }) {
  const { instagram, youtube } = platformsOf(p);
  const line = p.category || p.role;
  return (
    <article className="card group relative h-full flex flex-col overflow-hidden">
      <div className="relative">
        <Photo src={p.image} name={p.name} ratio="aspect-[4/5]" sizes="(min-width: 640px) 200px, 45vw" />
        {sample && <span className="tag absolute top-2 left-2">Sample</span>}
        {p.image && (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("toggle-moodboard", { detail: p.image }))}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${p.name}'s photo from your saved photos` : `Save ${p.name}'s photo`}
            title={saved ? "Saved" : "Save photo"}
            className="absolute top-2 right-2 z-10 w-8 h-8 inline-flex items-center justify-center rounded-[4px] bg-white/92 text-ink hover:bg-white cursor-pointer"
          >
            <Bookmark className={`w-4 h-4 ${saved ? "fill-current text-bronze" : ""}`} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-semibold text-ink leading-snug flex items-center gap-1">
          <a
            href={profileHref(p.slug)}
            onClick={inApp(() => onOpen(p))}
            className="truncate outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-offset-[-2px] focus-visible:after:outline-bronze group-hover:underline underline-offset-4 decoration-1"
          >
            {p.name}
          </a>
          {p.reviewed && !sample && <BadgeCheck className="w-4 h-4 text-bronze shrink-0" aria-label="Reviewed by our team" />}
        </h3>
        {line && <p className="text-[0.8125rem] text-ink-2 truncate">{line}</p>}
        {p.city && (
          <p className="mt-0.5 text-[0.75rem] text-ink-3 flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" /> {p.city}
          </p>
        )}
        {(p.reach || instagram || youtube) && (
          <p className="mt-auto pt-2.5 border-t border-line flex items-center gap-2 text-[0.75rem] text-ink-2 [&]:mt-2.5">
            {p.reach && (
              <span className="font-semibold text-ink tabular-nums" title="Audience reach supplied by the creator">
                {p.reach} <span className="font-normal text-ink-3">reach</span>
              </span>
            )}
            <span className="ml-auto flex items-center gap-1.5 text-ink-3">
              {instagram && <Instagram className="w-3.5 h-3.5" aria-label="On Instagram" />}
              {youtube && <Youtube className="w-4 h-4" aria-label="On YouTube" />}
            </span>
          </p>
        )}
      </div>
    </article>
  );
}

function SectionHead({ id, title, sub, action }: { id: string; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 id={id} className="h-block">{title}</h2>
        {sub && <p className="mt-1 text-[0.875rem] text-ink-2">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function RailButtons({ target }: { target: React.RefObject<HTMLUListElement | null> }) {
  const scroll = (dir: number) => target.current?.scrollBy({ left: dir * target.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <span className="hidden sm:flex gap-1.5">
      <button type="button" onClick={() => scroll(-1)} aria-label="Scroll back" className="w-9 h-9 inline-flex items-center justify-center rounded-[4px] border border-line-strong bg-surface hover:border-ink cursor-pointer">
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
      </button>
      <button type="button" onClick={() => scroll(1)} aria-label="Scroll forward" className="w-9 h-9 inline-flex items-center justify-center rounded-[4px] border border-line-strong bg-surface hover:border-ink cursor-pointer">
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </span>
  );
}

function FeaturedCreators({ profiles, status, moodboardItems, onSelectProfile, onNavigate, onRetry }: {
  profiles: ProfileView[];
  status: RosterStatus;
  moodboardItems: string[];
  onSelectProfile: HomeTabProps["onSelectProfile"];
  onNavigate: (tab: TabId) => void;
  onRetry: () => void;
}) {
  const rail = useRef<HTMLUListElement>(null);
  const list = profiles.slice(0, 10);
  return (
    <section aria-labelledby="home-profiles" className="min-w-0">
      <SectionHead
        id="home-profiles"
        title="Featured Creators"
        sub="Profiles from the directory. Open one to see their work and how to enquire."
        action={
          <span className="flex items-center gap-4">
            <TabLink tab="directory" onNavigate={onNavigate} className="see-all">
              View all creators <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </TabLink>
            {list.length > 4 && <RailButtons target={rail} />}
          </span>
        }
      />
      <RosterNotice status={status} onRetry={onRetry} className="mt-4" />
      {status === "loading" ? (
        <ul className="mt-5 flex gap-3 overflow-hidden" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="w-[11.5rem] shrink-0 space-y-2">
              <span className="block aspect-[4/5] bg-sunken" />
              <span className="block h-4 w-2/3 bg-sunken" />
              <span className="block h-3 w-1/2 bg-sunken" />
            </li>
          ))}
        </ul>
      ) : list.length ? (
        <ul ref={rail} className="mt-5 -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-1">
          {list.map((p) => (
            <li key={p.slug} className="w-[44%] sm:w-[11.5rem] shrink-0 snap-start">
              <CreatorCard p={p} sample={status === "sample"} saved={!!p.image && moodboardItems.includes(p.image)} onOpen={onSelectProfile} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 text-ink-2">No profiles are published yet. Creators appear here once our team approves their application.</p>
      )}
    </section>
  );
}

/* --------------------------------------------------------- magazine column */

function LatestGuides({ onGo }: { onGo: HomeTabProps["onGo"] }) {
  const [lead, ...rest] = BLOG_POSTS;
  if (!lead) return null;
  const target = (id: string): NavTarget => ({ tab: "greenlight", hash: `guide-${id}` });
  return (
    <section aria-labelledby="home-magazine" className="min-w-0">
      <SectionHead
        id="home-magazine"
        title="From the Magazine"
        action={
          <a href="/green-light/#blog" onClick={inApp(() => onGo({ tab: "greenlight", hash: "blog" }))} className="see-all">
            View all <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </a>
        }
      />
      <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] lg:grid-cols-1 xl:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
        <a
          href={`/green-light/#guide-${lead.id}`}
          onClick={inApp(() => onGo(target(lead.id)))}
          className="surface-dark group relative flex flex-col justify-between bg-[#1E1A15] text-white p-4 rounded-[4px] min-h-[15rem] overflow-hidden"
        >
          <span className="font-display leading-[0.9] text-[#E1C699]" aria-hidden="true">
            <span className="block text-[0.75rem] tracking-[0.3em] uppercase text-[#CFCAC0] font-sans font-semibold">Green Light</span>
            <span className="block text-[2.5rem] italic mt-1">Guides</span>
          </span>
          <span>
            <span className="block text-[0.75rem] uppercase tracking-[0.1em] text-[#CFCAC0]">{lead.category} · {lead.readMinutes} min read</span>
            <span className="block font-display text-[1.375rem] leading-tight mt-1 group-hover:underline underline-offset-4 decoration-1">{lead.title}</span>
            <span className="mt-2 inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-[#E1C699]">Read guide <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" /></span>
          </span>
        </a>
        <ul className="divide-y divide-line">
          {rest.slice(0, 3).map((post) => (
            <li key={post.id}>
              <a href={`/green-light/#guide-${post.id}`} onClick={inApp(() => onGo(target(post.id)))} className="group flex gap-3 py-3 first:pt-0">
                <span className="w-14 h-14 shrink-0 rounded-[3px] bg-bronze-soft text-bronze font-display text-[1.375rem] italic flex items-center justify-center" aria-hidden="true">
                  {post.category === "For Brands" ? "B" : post.category === "Awards" ? "A" : "C"}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-ink leading-snug group-hover:underline underline-offset-4 decoration-1">{post.title}</span>
                  <span className="block text-[0.75rem] text-ink-3 mt-1">{post.category} · {post.readMinutes} min read</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- categories */

function Categories({ profiles, categories, cities, onBrowse }: {
  profiles: ProfileView[];
  categories: [string, number][];
  cities: [string, number][];
  onBrowse: HomeTabProps["onBrowse"];
}) {
  const rail = useRef<HTMLUListElement>(null);
  if (!categories.length) return null;
  return (
    <section aria-labelledby="categories" className="min-w-0 scroll-mt-6">
      <SectionHead id="categories" title="Explore by Category" sub="Find creators in your niche." action={categories.length > 4 ? <RailButtons target={rail} /> : undefined} />
      <ul ref={rail} className="mt-5 -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-3 overflow-x-auto snap-x scrollbar-none pb-1">
        {categories.map(([name, n]) => {
          const cover = profiles.find((p) => p.category === name && p.image);
          return (
            <li key={name} className="w-[9.5rem] shrink-0 snap-start">
              <a href={`/talent/?category=${encodeURIComponent(name)}`} onClick={inApp(() => onBrowse({ category: name }))} className="card group block overflow-hidden h-full">
                <Photo src={cover?.image} name={name} ratio="aspect-[5/4]" sizes="152px" className="group-hover:[&_img]:scale-[1.03] [&_img]:transition-transform [&_img]:duration-500" />
                <span className="block px-3 py-2.5">
                  <span className="block font-semibold text-ink text-[0.9375rem] leading-tight">{name}</span>
                  <span className="block text-[0.75rem] text-ink-3 mt-0.5 tabular-nums">{plural(n, "creator", "creators")}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
      {cities.length > 1 && (
        <nav aria-labelledby="browse-city" className="mt-6 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-5">
          <h3 id="browse-city" className="label-caps shrink-0">By city</h3>
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
            {cities.slice(0, 12).map(([name, n]) => (
              <li key={name}>
                <a href={`/talent/?city=${encodeURIComponent(name)}`} onClick={inApp(() => onBrowse({ city: name }))} className="text-[0.875rem] text-ink hover:text-bronze underline-offset-4 hover:underline">
                  {name} <span className="text-ink-3 tabular-nums">{n}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </section>
  );
}

/* ---------------------------------------------- 3D gallery preview (CSS) */

// A light CSS preview of the real 3D gallery (which loads Three.js only on /gallery/).
// Real profile photos; arrows, swipe or a click on a side portrait move it; the centre one opens the profile.
function GalleryPreview({ profiles, sample, onGo, onSelectProfile }: { profiles: ProfileView[]; sample: boolean; onGo: HomeTabProps["onGo"]; onSelectProfile: HomeTabProps["onSelectProfile"] }) {
  const items = profiles.filter((p) => p.image).slice(0, 9);
  const [index, setIndex] = useState(Math.floor(Math.min(items.length, 9) / 2));
  const startX = useRef<number | null>(null);
  if (items.length < 3) return null;
  const current = items[Math.min(index, items.length - 1)];
  const move = (d: number) => setIndex((i) => Math.max(0, Math.min(items.length - 1, i + d)));
  return (
    <section aria-labelledby="home-gallery" className="min-w-0">
      <SectionHead
        id="home-gallery"
        title="3D Gallery"
        sub="Walk through the published profiles in an interactive 3D hall."
        action={
          <a href="/gallery/" onClick={inApp(() => onGo({ tab: "catwalk" }))} className="see-all">
            Open 3D Gallery <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </a>
        }
      />
      <div
        className="surface-dark mt-5 relative bg-[radial-gradient(ellipse_at_center,#3A3127_0%,#16130F_70%)] rounded-[4px] overflow-hidden h-[17rem] sm:h-[19rem] touch-pan-y"
        onPointerDown={(e) => (startX.current = e.clientX)}
        onPointerUp={(e) => {
          if (startX.current === null) return;
          const dx = e.clientX - startX.current;
          startX.current = null;
          if (Math.abs(dx) > 40) move(dx < 0 ? 1 : -1);
        }}
      >
        <div className="coverflow" role="group" aria-label="Gallery preview">
          {items.map((p, i) => {
            const off = i - index;
            const abs = Math.abs(off);
            return (
              <button
                key={p.slug}
                type="button"
                tabIndex={abs > 2 ? -1 : 0}
                aria-hidden={abs > 2 || undefined}
                aria-label={off === 0 ? `${p.name}: open profile` : `Show ${p.name}`}
                onClick={() => (off === 0 ? onSelectProfile(p) : setIndex(i))}
                className="coverflow-item"
                style={{
                  transform: `translate(-50%, -50%) translateX(${off === 0 ? 0 : Math.sign(off) * (68 + (abs - 1) * 46)}%) translateZ(${-abs * 70}px) rotateY(${off === 0 ? 0 : off < 0 ? 38 : -38}deg)`,
                  zIndex: 10 - abs,
                  opacity: abs > 3 ? 0 : 1 - abs * 0.12
                }}
              >
                <Photo src={p.image} name={p.name} ratio="h-full" sizes="160px" />
              </button>
            );
          })}
        </div>
        <button type="button" onClick={() => move(-1)} disabled={index === 0} aria-label="Previous portrait" className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/92 text-ink inline-flex items-center justify-center disabled:opacity-40 cursor-pointer">
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => move(1)} disabled={index === items.length - 1} aria-label="Next portrait" className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/92 text-ink inline-flex items-center justify-center disabled:opacity-40 cursor-pointer">
          <ChevronRight className="w-5 h-5" aria-hidden="true" />
        </button>
        <p className="absolute bottom-3 inset-x-0 text-center text-[0.8125rem] text-[#E7E3DA] z-20 pointer-events-none" aria-live="polite">
          <span className="font-semibold text-white">{current.name}</span>
          {current.category && <> · {current.category}</>}
          {sample && <span className="text-[#CFCAC0]"> (sample)</span>}
        </p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- page */

export default function HomeTab({ profiles, status, onNavigate, onGo, onSelectProfile, onBrandEnquiry, onAwardEnquiry, onBrowse, onRetry, moodboardItems = [] }: HomeTabProps) {
  const categories = useMemo(() => countBy(profiles.map((p) => p.category)), [profiles]);
  const cities = useMemo(() => countBy(profiles.map((p) => p.city)), [profiles]);
  const sample = status === "sample";

  return (
    <div>
      <Hero
        profiles={profiles}
        status={status}
        categories={categories}
        cities={cities}
        onBrowse={onBrowse}
        onNavigate={onNavigate}
        onSelectProfile={onSelectProfile}
        onBrandEnquiry={onBrandEnquiry}
      />

      <FeatureStrip profiles={profiles} onGo={onGo} />

      <div className="page-wide py-12 lg:py-14 space-y-12 lg:space-y-14">
        <div className="grid gap-12 lg:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
          <FeaturedCreators profiles={profiles} status={status} moodboardItems={moodboardItems} onSelectProfile={onSelectProfile} onNavigate={onNavigate} onRetry={onRetry} />
          <LatestGuides onGo={onGo} />
        </div>

        <div className="grid gap-12 lg:gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,6fr)]">
          <Categories profiles={profiles} categories={categories} cities={cities} onBrowse={onBrowse} />
          <GalleryPreview profiles={profiles} sample={sample} onGo={onGo} onSelectProfile={onSelectProfile} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-[4px] border border-line bg-[linear-gradient(120deg,#F6EEDF,#EFE3CC)] p-6 sm:p-7">
            <p className="eyebrow">Explore Magazine</p>
            <h2 className="mt-2 font-semibold text-[1.375rem] text-ink leading-tight">Be part of the next feature</h2>
            <p className="mt-2 text-[0.9375rem] text-ink-2 max-w-md">
              Book a cover story, an inside feature or a digital spotlight for yourself or your brand. We reply with dates and rates.
            </p>
            <a href="/green-light/#magazine-booking" onClick={inApp(() => onGo({ tab: "greenlight", hash: "magazine-booking" }))} className="btn btn-primary mt-5">
              Send a booking request <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
          <div className="surface-dark relative overflow-hidden rounded-[4px] bg-[linear-gradient(120deg,#1B1A17,#3A2E1E)] text-white p-6 sm:p-7">
            <Trophy className="absolute -right-4 -bottom-6 w-44 h-44 text-[#E1C699]/15" aria-hidden="true" strokeWidth={1.25} />
            <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-[#E1C699]">{APPLICATIONS_OPEN ? "Registration open" : "The award"}</p>
            <h2 className="mt-2 font-semibold text-[1.375rem] leading-tight">{AWARD_NAME}, first edition</h2>
            <p className="mt-2 text-[0.9375rem] text-[#CFCAC0] max-w-md">Open to Indian creators in every niche. Free to apply; our team reviews every application.</p>
            <div className="mt-5 flex flex-wrap gap-3 relative">
              <TabLink tab="apply" onNavigate={onNavigate} className="btn btn-primary">{APPLY_LABEL}</TabLink>
              <a href="/#the-award" onClick={inApp(() => onGo({ tab: "home", hash: "the-award" }))} className="btn btn-ghost-light">How the award works</a>
            </div>
          </div>
        </div>
      </div>

      {/* For creators: how applying works */}
      <section aria-labelledby="for-creators" className="page-wide section scroll-mt-4">
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
        <div className="page-wide section grid gap-10 lg:gap-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
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
      <section aria-labelledby="how-profiles" className="page-wide section scroll-mt-4">
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
        <div className="page-wide section grid gap-10 lg:gap-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="space-y-4">
            <p className="eyebrow">The award</p>
            <h2 id="the-award" className="h-section">{AWARD.name}</h2>
            <p className="text-[0.9375rem] text-ink-2">
              {APPLICATIONS_OPEN && <><strong className="font-semibold text-[#2f6b45]">Registration is open.</strong>{" "}</>}
              A new award, run by {ORGANISER.name} from {ORGANISER.locality}.
            </p>
            <p className="text-ink-2">{AWARD.text}</p>
            <p className="text-[0.9375rem] text-ink-2">
              <span className="font-semibold text-ink">Niches include</span> {ELIGIBLE_NICHES.slice(0, 6).join(", ").toLowerCase()} and more.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <TabLink tab="apply" onNavigate={onNavigate} className="btn btn-primary">{APPLY_LABEL}</TabLink>
              <button type="button" onClick={onAwardEnquiry} className="btn btn-secondary">Ask about the award</button>
            </div>
            <p className="text-[0.875rem] text-ink-3 border-l-2 border-line-strong pl-3">{ANTI_FRAUD_NOTE}</p>
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
