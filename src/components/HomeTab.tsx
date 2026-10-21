import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  BookOpen,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Crown,
  Handshake,
  Mail,
  Megaphone,
  Search,
  Sparkles,
  Star,
  UserRound
} from "lucide-react";
import type { Creator } from "../data";
import { ROUTES, TabId } from "../seo";
import { TRADITIONAL_AWARDS, PREMIUM_AWARDS, VALUE_FLOW, AwardCategory, influencerId } from "../content/awards";
import TabLink from "./TabLink";

interface Section {
  id: string;
  title: string;
  creators: Creator[];
}

interface HomeTabProps {
  sections: Section[];
  onNavigate: (tab: TabId) => void;
  onSelectCreator: (creator: Creator) => void;
  onOpenGallerySection: (index: number) => void;
  onBrandEnquiry: () => void;
}

const SLIDES: { eyebrow: string; text: string; cta: string; tab: TabId }[] = [
  {
    eyebrow: "Influencer Awards",
    text: "Apply for India's influencer awards in traditional and premium categories, judged by the FSIA team.",
    cta: "Apply for an award",
    tab: "apply"
  },
  {
    eyebrow: "Star India Membership",
    text: "Awardees become Star India members with an Influencer ID profile, branding and marketing support.",
    cta: "See member profiles",
    tab: "starindia"
  },
  {
    eyebrow: "Brand Deals",
    text: "Brands hire awarded, verified influencers through FSIA for paid collaborations across India.",
    cta: "Hire awarded influencers",
    tab: "directory"
  }
];

const SLIDE_MS = 7000;

const linkButton =
  "inline-flex items-center justify-center gap-2 font-semibold text-sm px-5 py-3 rounded-xl cursor-pointer transition-colors";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

const Avatar: React.FC<{ creator: Creator; className: string }> = ({ creator, className }) => {
  const [failed, setFailed] = useState(false);
  if (!creator.image || failed) {
    return (
      <div className={`${className} bg-[#F3F3F1] flex items-center justify-center`} aria-hidden="true">
        <UserRound className="w-1/3 h-1/3 text-[#8E8D8A]" />
      </div>
    );
  }
  return <img src={creator.image} alt="" loading="lazy" onError={() => setFailed(true)} className={`${className} object-cover`} />;
};

// ----------------------------------------------------
// Hero slider
// ----------------------------------------------------
function HeroSlider({ creators, onNavigate }: { creators: Creator[]; onNavigate: (tab: TabId) => void }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (paused || reduced) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [paused, reduced]);

  const go = (delta: number) => setIndex((i) => (i + delta + SLIDES.length) % SLIDES.length);
  const slide = SLIDES[index];
  // Each slide shows a different group of creators on either side of the headline
  const pick = (offset: number) =>
    creators.length ? [0, 1, 2].map((n) => creators[(index * 6 + offset + n) % creators.length]) : [];
  const left = pick(0);
  const right = pick(3);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className="relative bg-gradient-to-b from-[#F6EFE3] to-[#FBF8F2] border border-[#E1C699]/50 rounded-3xl shadow-sm overflow-hidden"
    >
      <div className="text-center space-y-3 px-14 sm:px-20 pt-10">
          <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.25em] uppercase text-champagne">
            <Sparkles className="w-4 h-4" aria-hidden="true" /> FSIA Influencer
          </p>
          <h1 className="font-serif-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#111] leading-[1.1] max-w-4xl mx-auto">
            Best Indian Influencer Award Agency &amp; Company
          </h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,1.3fr)_1fr] items-end gap-6 px-6 sm:px-14 pt-6 pb-16 md:pb-20">
        <div className="hidden lg:flex items-end justify-center gap-2" aria-hidden="true">
          {left.map((c, i) => (
            <Avatar key={`${c.name}-${i}`} creator={c} className={`rounded-t-full ${i === 1 ? "w-28 h-48" : "w-24 h-40"} shadow-md`} />
          ))}
        </div>

        <div className="text-center space-y-4">
          <div
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${SLIDES.length}: ${slide.eyebrow}`}
            aria-live={paused ? "polite" : "off"}
            className="space-y-4 min-h-[9.5rem] sm:min-h-[8rem]"
          >
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2e2c29]">{slide.eyebrow}</p>
            <p className="font-serif-text text-lg md:text-xl text-[#2e2c29] max-w-xl mx-auto leading-relaxed">{slide.text}</p>
            <TabLink tab={slide.tab} onNavigate={onNavigate} className={`${linkButton} bg-[#111] hover:bg-[#222] text-white`}>
              {slide.cta} <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </TabLink>
          </div>
          {/* Small creator row in place of the side images on phones and tablets */}
          <div className="flex lg:hidden justify-center -space-x-3 pt-2" aria-hidden="true">
            {[...left, ...right].map((c, i) => (
              <Avatar key={`${c.name}-m${i}`} creator={c} className="w-11 h-11 rounded-full border-2 border-white" />
            ))}
          </div>
        </div>

        <div className="hidden lg:flex items-end justify-center gap-2" aria-hidden="true">
          {right.map((c, i) => (
            <Avatar key={`${c.name}-${i}`} creator={c} className={`rounded-t-full ${i === 1 ? "w-28 h-48" : "w-24 h-40"} shadow-md`} />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Previous slide"
        className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white border border-black/15 shadow flex items-center justify-center text-[#111] hover:bg-[#F3F3F1] cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Next slide"
        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white border border-black/15 shadow flex items-center justify-center text-[#111] hover:bg-[#F3F3F1] cursor-pointer"
      >
        <ChevronRight className="w-5 h-5" aria-hidden="true" />
      </button>
      <div className="absolute bottom-8 md:bottom-10 inset-x-0 flex justify-center gap-1">
        {SLIDES.map((s, i) => (
          <button
            key={s.eyebrow}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show slide ${i + 1}: ${s.eyebrow}`}
            aria-current={i === index ? "true" : undefined}
            className="w-6 h-6 flex items-center justify-center cursor-pointer"
          >
            <span className={`block h-2 rounded-full transition-all ${i === index ? "w-6 bg-[#111]" : "w-2 bg-[#111]/30"}`} />
          </button>
        ))}
      </div>
    </section>
  );
}

// ----------------------------------------------------
// Search: creators, award categories and pages
// ----------------------------------------------------
type Result =
  | { kind: "creator"; label: string; detail: string; creator: Creator }
  | { kind: "award"; label: string; detail: string }
  | { kind: "gallery"; label: string; detail: string; sectionIndex: number }
  | { kind: "page"; label: string; detail: string; tab: TabId };

function HomeSearch({
  sections,
  onNavigate,
  onSelectCreator,
  onOpenGallerySection
}: Pick<HomeTabProps, "sections" | "onNavigate" | "onSelectCreator" | "onOpenGallerySection">) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const has = (...parts: (string | undefined)[]) => parts.some((p) => p && p.toLowerCase().includes(q));
    const out: Result[] = [];
    sections.forEach((section) =>
      (section.creators || []).forEach((c) => {
        if (has(c.name, c.role, c.city, section.title))
          out.push({ kind: "creator", label: c.name, detail: [c.role, c.city].filter(Boolean).join(" · "), creator: c });
      })
    );
    sections.forEach((section, i) => {
      if (has(section.title)) out.push({ kind: "gallery", label: section.title, detail: "Awardee category in the 3D gallery", sectionIndex: i });
    });
    [...TRADITIONAL_AWARDS, ...PREMIUM_AWARDS].forEach((a) => {
      if (has(a.title, a.blurb, a.creatorCategory)) out.push({ kind: "award", label: a.title, detail: "Award category · apply now" });
    });
    ROUTES.filter((r) => r.indexable && r.tab !== "home").forEach((r) => {
      if (has(r.heading, r.description)) out.push({ kind: "page", label: r.heading, detail: "Page", tab: r.tab });
    });
    return out.slice(0, 8);
  }, [query, sections]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const choose = (r: Result) => {
    setOpen(false);
    if (r.kind === "creator") onSelectCreator(r.creator);
    else if (r.kind === "gallery") onOpenGallerySection(r.sectionIndex);
    else if (r.kind === "award") onNavigate("apply");
    else onNavigate(r.tab);
  };

  const showList = open && query.trim().length >= 2;

  return (
    <div ref={boxRef} className="relative max-w-2xl mx-auto -mt-7 z-10 px-2" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (results[0]) choose(results[0]);
          else if (query.trim()) onNavigate("directory");
        }}
      >
        <label htmlFor="home-search" className="sr-only">Search influencers, awards and opportunities</label>
        <div className="flex items-center gap-3 bg-white border border-black/15 rounded-full shadow-md px-5 py-3.5 focus-within:border-[#111]">
          <Search className="w-5 h-5 text-[#47453f] shrink-0" aria-hidden="true" />
          <input
            id="home-search"
            type="search"
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search influencers, awards & opportunities"
            role="combobox"
            aria-autocomplete="list"
            aria-controls="home-search-results"
            aria-expanded={showList}
            className="flex-1 min-w-0 bg-transparent text-[15px] text-[#111] outline-none"
          />
        </div>
      </form>
      {showList && (
        <div id="home-search-results" className="absolute left-2 right-2 mt-2 bg-white border border-black/10 rounded-2xl shadow-xl overflow-hidden">
          <p className="sr-only" role="status">{results.length ? `${results.length} results` : "No results"}</p>
          {results.length ? (
            <ul className="max-h-80 overflow-y-auto divide-y divide-black/5">
              {results.map((r, i) => (
                <li key={`${r.kind}-${r.label}-${i}`}>
                  <button
                    type="button"
                    onClick={() => choose(r)}
                    className="w-full text-left px-5 py-3 hover:bg-[#FAF9F6] focus:bg-[#FAF9F6] cursor-pointer flex items-center gap-3"
                  >
                    {r.kind === "creator" ? (
                      <Avatar creator={r.creator} className="w-9 h-9 rounded-full shrink-0" />
                    ) : (
                      <span className="w-9 h-9 rounded-full bg-[#F6EFE3] flex items-center justify-center shrink-0" aria-hidden="true">
                        {r.kind === "award" ? <Award className="w-4 h-4" /> : r.kind === "gallery" ? <Star className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold text-[#111] truncate">{r.label}</span>
                      <span className="block text-[13px] text-[#47453f] truncate">{r.detail}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-4 text-sm text-[#2e2c29]">
              No matches for “{query.trim()}”.{" "}
              <TabLink tab="directory" onNavigate={onNavigate} className="font-semibold underline underline-offset-2">
                Browse all talent
              </TabLink>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// Award category grids
// ----------------------------------------------------
function AwardGrid({
  id,
  title,
  text,
  awards,
  premium,
  onNavigate
}: {
  id: string;
  title: string;
  text: string;
  awards: AwardCategory[];
  premium?: boolean;
  onNavigate: (tab: TabId) => void;
}) {
  const Icon = premium ? Crown : Award;
  return (
    <section aria-labelledby={id} className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h2 id={id} className="font-serif-display text-2xl md:text-3xl font-bold text-[#111]">{title}</h2>
          <p className="text-[15px] text-[#2e2c29] mt-1">{text}</p>
        </div>
        <TabLink tab="apply" onNavigate={onNavigate} className="text-sm font-semibold text-[#111] underline underline-offset-4 hover:no-underline shrink-0">
          Apply now
        </TabLink>
      </div>
      <ul className={`grid gap-4 ${premium ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
        {awards.map((a) => (
          <li key={a.id}>
            <TabLink
              tab="apply"
              onNavigate={onNavigate}
              aria-label={`${a.title}: apply`}
              className={`group h-full flex flex-col gap-3 p-5 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-md ${
                premium ? "surface-dark bg-[#111] border-[#E1C699]/40 text-white" : "bg-white border-black/10"
              }`}
            >
              <span
                className={`w-10 h-10 rounded-full flex items-center justify-center ${premium ? "bg-[#E1C699]/20 text-champagne" : "bg-[#F6EFE3] text-[#111]"}`}
                aria-hidden="true"
              >
                <Icon className="w-5 h-5" />
              </span>
              <span className={`font-serif-display text-lg font-bold leading-snug ${premium ? "text-white" : "text-[#111]"}`}>{a.title}</span>
              <span className={`text-sm leading-relaxed ${premium ? "text-[#e9e6df]" : "text-[#2e2c29]"}`}>{a.blurb}</span>
              <span className={`mt-auto text-sm font-semibold inline-flex items-center gap-1 ${premium ? "text-champagne" : "text-[#111]"}`}>
                Apply <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </TabLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ----------------------------------------------------
// Page
// ----------------------------------------------------
export default function HomeTab({ sections, onNavigate, onSelectCreator, onOpenGallerySection, onBrandEnquiry }: HomeTabProps) {
  const creators = useMemo(() => sections.flatMap((s) => s.creators || []).filter((c) => c && c.name), [sections]);
  const featured = creators.slice(0, 4);
  const flowIcons = [ClipboardCheck, Megaphone, Handshake];

  return (
    <div className="w-full max-w-6xl mx-auto pt-4 md:pt-6 space-y-16 md:space-y-20">
      <div>
        <HeroSlider creators={creators} onNavigate={onNavigate} />
        <HomeSearch sections={sections} onNavigate={onNavigate} onSelectCreator={onSelectCreator} onOpenGallerySection={onOpenGallerySection} />
      </div>

      <AwardGrid
        id="traditional-awards"
        title="Traditional award categories"
        text="Awards for the best creators in each niche."
        awards={TRADITIONAL_AWARDS}
        onNavigate={onNavigate}
      />
      <AwardGrid
        id="premium-awards"
        title="Premium award categories"
        text="Top honours judged across every niche."
        awards={PREMIUM_AWARDS}
        premium
        onNavigate={onNavigate}
      />

      {/* Award-to-Business value flow */}
      <section aria-labelledby="value-flow" className="space-y-8">
        <div className="text-center space-y-2">
          <h2 id="value-flow" className="font-serif-display text-2xl md:text-4xl font-bold text-[#111]">The Award-to-Business Value Flow</h2>
          <p className="text-[15px] text-[#2e2c29] max-w-2xl mx-auto">How an award turns into branding support and paid brand deals.</p>
        </div>
        <ol className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
          <span
            aria-hidden="true"
            className="hidden md:block absolute top-10 left-[16%] right-[16%] h-1 rounded-full bg-gradient-to-r from-[#8b2635] via-[#1e2a4a] to-[#1f5a3d] opacity-70"
          />
          {VALUE_FLOW.map((step, i) => {
            const Icon = flowIcons[i];
            const middle = i === 1;
            return (
              <li
                key={step.step}
                className={`relative flex flex-col items-center text-center gap-3 p-6 rounded-2xl border ${
                  middle ? "surface-dark bg-[#111] border-[#E1C699]/40 text-white" : "bg-white border-black/10"
                }`}
              >
                <span
                  className={`w-16 h-16 rounded-full flex items-center justify-center border-4 border-[#FAF9F6] ${middle ? "bg-[#E1C699] text-[#111]" : "bg-[#111] text-white"}`}
                  aria-hidden="true"
                >
                  <Icon className="w-7 h-7" />
                </span>
                <h3 className={`font-sans text-lg font-bold ${middle ? "text-white" : "text-[#111]"}`}>
                  {step.step}. {step.title}
                </h3>
                <p className={`text-[15px] leading-relaxed ${middle ? "text-[#e9e6df]" : "text-[#2e2c29]"}`}>{step.text}</p>
                {i === 0 && (
                  <TabLink tab="apply" onNavigate={onNavigate} className={`${linkButton} mt-auto bg-[#111] hover:bg-[#222] text-white`}>
                    Apply for an award
                  </TabLink>
                )}
                {i === 1 && (
                  <TabLink tab="starindia" onNavigate={onNavigate} className={`${linkButton} mt-auto bg-[#E1C699] hover:bg-[#d4b57f] text-[#111]`}>
                    Star India membership
                  </TabLink>
                )}
                {i === 2 && (
                  <button type="button" onClick={onBrandEnquiry} className={`${linkButton} mt-auto bg-[#111] hover:bg-[#222] text-white`}>
                    <Briefcase className="w-4 h-4" aria-hidden="true" /> Send a brand enquiry
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* Featured awardees */}
      {featured.length > 0 && (
        <section aria-labelledby="featured-awardees" className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <h2 id="featured-awardees" className="font-serif-display text-2xl md:text-3xl font-bold text-[#111]">Featured awardees</h2>
            <div className="flex gap-5">
              <TabLink tab="catwalk" onNavigate={onNavigate} className="text-sm font-semibold text-[#111] underline underline-offset-4 hover:no-underline">
                Walk the 3D gallery
              </TabLink>
              <TabLink tab="starindia" onNavigate={onNavigate} className="text-sm font-semibold text-[#111] underline underline-offset-4 hover:no-underline">
                All Star India profiles
              </TabLink>
            </div>
          </div>
          <ul className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map((c) => (
              <li key={c.name}>
                <button
                  type="button"
                  onClick={() => onSelectCreator(c)}
                  aria-label={`View ${c.name}`}
                  className="w-full text-left bg-white border border-black/10 rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                >
                  <Avatar creator={c} className="w-full aspect-[4/5]" />
                  <span className="block p-4 space-y-1">
                    <span className="block font-serif-display text-base md:text-lg font-bold text-[#111] truncate">{c.name}</span>
                    <span className="block text-[13px] text-[#47453f] line-clamp-2">{c.role}</span>
                    <span className="block font-mono text-[12px] text-[#2e2c29]">{influencerId(c.name)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Ecosystem: Star India, Green Light, Contact */}
      <section aria-labelledby="ecosystem" className="space-y-6">
        <h2 id="ecosystem" className="font-serif-display text-2xl md:text-3xl font-bold text-[#111] text-center">Star India &amp; Green Light</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <TabLink tab="starindia" onNavigate={onNavigate} className="group bg-gradient-to-br from-[#1f5a3d] to-[#123524] surface-dark text-white rounded-2xl p-6 space-y-3 hover:shadow-lg transition-shadow">
            <Star className="w-7 h-7 text-champagne" aria-hidden="true" />
            <span className="block font-serif-display text-xl font-bold">Star India</span>
            <span className="block text-[15px] text-[#e9e6df]">Membership and Influencer ID profiles for awardees and verified creators.</span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-champagne">Membership &amp; profiles <ChevronRight className="w-4 h-4" aria-hidden="true" /></span>
          </TabLink>
          <TabLink tab="greenlight" onNavigate={onNavigate} className="group bg-gradient-to-br from-[#1e2a4a] to-[#111a33] surface-dark text-white rounded-2xl p-6 space-y-3 hover:shadow-lg transition-shadow">
            <BookOpen className="w-7 h-7 text-champagne" aria-hidden="true" />
            <span className="block font-serif-display text-xl font-bold">Green Light</span>
            <span className="block text-[15px] text-[#e9e6df]">The FSIA blog and Explore Magazine, with cover and feature bookings.</span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-champagne">Blog, magazine &amp; booking <ChevronRight className="w-4 h-4" aria-hidden="true" /></span>
          </TabLink>
          <TabLink tab="contact" onNavigate={onNavigate} className="group bg-white border border-black/10 rounded-2xl p-6 space-y-3 hover:shadow-lg transition-shadow">
            <Mail className="w-7 h-7 text-[#111]" aria-hidden="true" />
            <span className="block font-serif-display text-xl font-bold text-[#111]">Contact</span>
            <span className="block text-[15px] text-[#2e2c29]">Questions about awards, membership or brand deals? Send us a message.</span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#111]">Contact form <ChevronRight className="w-4 h-4" aria-hidden="true" /></span>
          </TabLink>
        </div>
      </section>
    </div>
  );
}
