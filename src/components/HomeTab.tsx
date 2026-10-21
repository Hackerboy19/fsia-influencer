import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  TrendingUp,
  Trophy,
  UserRound
} from "lucide-react";
import type { Creator } from "../data";
import { ROUTES, TabId } from "../seo";
import { TRADITIONAL_AWARDS, PREMIUM_AWARDS, VALUE_FLOW, AwardCategory, influencerId, parseReach, formatReach } from "../content/awards";
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
  // Read synchronously so reduced-motion visitors never see a first animated frame
  const [reduced, setReduced] = useState(() => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
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
// Scroll reveal (off when the visitor prefers reduced motion)
// ----------------------------------------------------
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div"
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li";
  key?: React.Key;
}) {
  const reduced = useReducedMotion();
  if (reduced) return as === "li" ? <li className={className}>{children}</li> : <div className={className}>{children}</div>;
  const Tag = as === "li" ? motion.li : motion.div;
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Tag>
  );
}

const Sparkle = ({ className, delay = 0 }: { className: string; delay?: number }) => (
  <span aria-hidden="true" className={`absolute text-[#E1C699] fsia-twinkle pointer-events-none ${className}`} style={{ animationDelay: `${delay}s` }}>
    ✦
  </span>
);

// ----------------------------------------------------
// Hero slider
// ----------------------------------------------------
function HeroSlider({ creators, onNavigate }: { creators: Creator[]; onNavigate: (tab: TabId) => void }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const autoplay = !paused && !reduced;

  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % SLIDES.length), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [autoplay, index]);

  const go = (delta: number) => setIndex((i) => (i + delta + SLIDES.length) % SLIDES.length);
  const slide = SLIDES[index];
  // Each slide shows a different group of creators on either side of the headline
  const pick = (offset: number) =>
    creators.length ? [0, 1, 2].map((n) => creators[(index * 6 + offset + n) % creators.length]) : [];
  const left = pick(0);
  const right = pick(3);
  const fade = reduced
    ? {}
    : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.45 } };

  const arrow =
    "w-11 h-11 rounded-full bg-white/95 border border-black/15 shadow-md flex items-center justify-center text-[#111] hover:bg-white hover:scale-105 transition cursor-pointer";

  const sideGroup = (group: Creator[], key: string, align: "left" | "right") => (
    <div className="hidden lg:flex items-end justify-center gap-2" aria-hidden="true">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${key}-${index}`}
          className="flex items-end gap-2"
          {...(reduced
            ? {}
            : {
                initial: { opacity: 0, x: align === "left" ? -24 : 24 },
                animate: { opacity: 1, x: 0 },
                exit: { opacity: 0 },
                transition: { duration: 0.55 }
              })}
        >
          {group.map((c, i) => (
            <div key={`${c.name}-${i}`} className="relative">
              <Avatar
                creator={c}
                className={`rounded-t-full ring-2 ring-white shadow-lg ${i === 1 ? "w-28 h-52" : "w-24 h-44"}`}
              />
              {i === 1 && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-b from-[#f3dca6] to-[#b8893b] shadow flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-[#3b2a0c]" />
                </span>
              )}
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className="relative rounded-3xl overflow-hidden shadow-xl"
    >
      {/* Navy gala band behind the headline */}
      <div className="surface-dark relative bg-gradient-to-br from-[#0f1a33] via-[#16233f] to-[#0b1426] px-6 sm:px-16 pt-10 pb-24 text-center">
        <div aria-hidden="true" className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top,rgba(225,198,153,0.35),transparent_60%)]" />
        <Sparkle className="top-6 left-[12%] text-lg" />
        <Sparkle className="top-16 right-[14%] text-sm" delay={0.8} />
        <Sparkle className="bottom-10 left-[22%] text-xs" delay={1.6} />
        <Sparkle className="bottom-14 right-[26%] text-base" delay={2.2} />
        <p className="relative inline-flex items-center gap-2 text-xs font-bold tracking-[0.3em] uppercase text-champagne">
          <Sparkles className="w-4 h-4" aria-hidden="true" /> FSIA Influencer
        </p>
        <h1 className="relative font-serif-display text-[2rem] leading-[1.12] sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mt-3 max-w-4xl mx-auto">
          <span className="fsia-gold-text">Best Indian Influencer</span>
          <br className="hidden sm:block" /> Award Agency &amp; Company
        </h1>
      </div>

      {/* Cream stage with the slides */}
      <div className="relative -mt-14 mx-3 sm:mx-6 mb-3 sm:mb-6 rounded-2xl bg-gradient-to-b from-[#FBF6EC] to-[#F4EBDA] border border-[#E1C699]/60 shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,1.25fr)_1fr] items-end gap-6 px-5 sm:px-16 pt-8 pb-20">
          {sideGroup(left, "left", "left")}

          <div className="text-center">
            <div
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${SLIDES.length}: ${slide.eyebrow}`}
              aria-live={paused ? "polite" : "off"}
              className="min-h-[13rem] sm:min-h-[11rem] flex flex-col items-center justify-center"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={index} className="space-y-4" {...fade}>
                  <p className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.2em] text-[#5b4a2c]">
                    <span className="w-6 h-px bg-[#b8893b]" aria-hidden="true" />
                    {slide.eyebrow}
                    <span className="w-6 h-px bg-[#b8893b]" aria-hidden="true" />
                  </p>
                  <p className="font-serif-text text-xl md:text-2xl text-[#2e2c29] max-w-xl mx-auto leading-relaxed">{slide.text}</p>
                  <TabLink tab={slide.tab} onNavigate={onNavigate} className={`${linkButton} bg-[#111] hover:bg-[#222] text-white shadow-md`}>
                    {slide.cta} <ChevronRight className="w-4 h-4 text-champagne" aria-hidden="true" />
                  </TabLink>
                </motion.div>
              </AnimatePresence>
            </div>
            {/* Small creator row in place of the side images on phones and tablets */}
            <div className="flex lg:hidden justify-center -space-x-3 pt-4" aria-hidden="true">
              {[...left, ...right].map((c, i) => (
                <Avatar key={`${c.name}-m${i}`} creator={c} className="w-11 h-11 rounded-full border-2 border-white shadow" />
              ))}
            </div>
          </div>

          {sideGroup(right, "right", "right")}
        </div>

        {/* Controls: arrows at the sides on larger screens, beside the dots on phones */}
        <button type="button" onClick={() => go(-1)} aria-label="Previous slide" className={`${arrow} hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2`}>
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => go(1)} aria-label="Next slide" className={`${arrow} hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2`}>
          <ChevronRight className="w-5 h-5" aria-hidden="true" />
        </button>
        <div className="absolute bottom-8 inset-x-0 flex items-center justify-center gap-2">
          <button type="button" onClick={() => go(-1)} aria-label="Previous slide" className={`${arrow} sm:hidden w-9 h-9`}>
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          {SLIDES.map((s, i) => (
            <button
              key={s.eyebrow}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1}: ${s.eyebrow}`}
              aria-current={i === index ? "true" : undefined}
              className="h-6 min-w-6 flex items-center justify-center cursor-pointer"
            >
              <span className={`relative block h-2 rounded-full overflow-hidden transition-all ${i === index ? "w-10 bg-[#111]/20" : "w-2 bg-[#111]/30"}`}>
                {i === index && (
                  <motion.span
                    key={`${index}-${autoplay}`}
                    className="absolute inset-y-0 left-0 bg-[#111] rounded-full"
                    initial={{ width: autoplay ? "0%" : "100%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: autoplay ? SLIDE_MS / 1000 : 0, ease: "linear" }}
                  />
                )}
              </span>
            </button>
          ))}
          <button type="button" onClick={() => go(1)} aria-label="Next slide" className={`${arrow} sm:hidden w-9 h-9`}>
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

// Live figures from the roster and award lists (nothing invented)
function StatsStrip({ creators, sections }: { creators: Creator[]; sections: Section[] }) {
  const reach = creators.reduce((sum, c) => sum + parseReach(c.stats?.reach), 0);
  const cities = new Set(creators.map((c) => (c.city || "").trim()).filter(Boolean)).size;
  const stats = [
    { value: String(TRADITIONAL_AWARDS.length + PREMIUM_AWARDS.length), label: "Award categories" },
    { value: String(creators.length), label: "Star India profiles" },
    { value: reach ? `${formatReach(reach)}+` : "—", label: "Combined audience" },
    { value: String(cities || sections.length), label: cities ? "Cities represented" : "Gallery categories" }
  ];
  return (
    <dl className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#E1C699]/50 rounded-2xl overflow-hidden border border-[#E1C699]/50">
      {stats.map((s) => (
        <div key={s.label} className="bg-white px-5 py-5 text-center">
          <dt className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#47453f]">{s.label}</dt>
          <dd className="font-serif-display text-3xl md:text-4xl font-bold text-[#111] mt-1">{s.value}</dd>
        </div>
      ))}
    </dl>
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
      <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-champagne">{premium ? "Premium" : "Traditional"}</p>
          <h2 id={id} className="font-serif-display text-3xl md:text-4xl font-bold text-[#111] mt-1">{title}</h2>
          <p className="text-[15px] text-[#2e2c29] mt-1">{text}</p>
        </div>
        <TabLink tab="apply" onNavigate={onNavigate} className="text-sm font-semibold text-[#111] underline underline-offset-4 hover:no-underline shrink-0">
          Apply now
        </TabLink>
      </Reveal>
      <ul className={`grid gap-4 ${premium ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
        {awards.map((a, i) => (
          <Reveal as="li" key={a.id} delay={Math.min(i, 7) * 0.05}>
            <TabLink
              tab="apply"
              onNavigate={onNavigate}
              aria-label={`${a.title}: apply`}
              className={`group relative h-full flex flex-col gap-3 p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden ${
                premium ? "surface-dark fsia-gold-border text-white" : "bg-white border border-black/10 hover:border-[#b8893b]/60"
              }`}
            >
              {premium && (
                <span aria-hidden="true" className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-[radial-gradient(circle,rgba(243,220,166,0.25),transparent_70%)] transition-transform duration-500 group-hover:scale-125" />
              )}
              <span
                className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110 ${
                  premium ? "bg-gradient-to-b from-[#f3dca6] to-[#b8893b] text-[#3b2a0c]" : "bg-[#F6EFE3] text-[#111]"
                }`}
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
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

// ----------------------------------------------------
// Award-to-Business value flow
// ----------------------------------------------------
function Ribbons() {
  const reduced = useReducedMotion();
  const paths = [
    { d: "M0 70 C 160 10, 300 130, 460 70 S 760 10, 920 70 S 1220 130, 1200 70", color: "#8b2635" },
    { d: "M0 80 C 160 140, 300 20, 460 80 S 760 140, 920 80 S 1220 20, 1200 80", color: "#1e2a4a" },
    { d: "M0 75 C 180 30, 320 120, 480 75 S 780 30, 940 75 S 1200 120, 1200 75", color: "#1f5a3d" }
  ];
  return (
    <svg aria-hidden="true" viewBox="0 0 1200 150" preserveAspectRatio="none" className="hidden md:block absolute left-0 right-0 top-16 w-full h-36 pointer-events-none">
      {paths.map((p, i) => (
        <motion.path
          key={p.color}
          d={p.d}
          fill="none"
          stroke={p.color}
          strokeWidth={10 - i * 2}
          strokeLinecap="round"
          strokeOpacity={0.55}
          {...(reduced
            ? {}
            : {
                initial: { pathLength: 0 },
                whileInView: { pathLength: 1 },
                viewport: { once: true, amount: 0.3 },
                transition: { duration: 1.6, delay: i * 0.2, ease: "easeInOut" }
              })}
        />
      ))}
    </svg>
  );
}

function ValueFlow({
  spotlight,
  onNavigate,
  onBrandEnquiry
}: {
  spotlight?: Creator;
  onNavigate: (tab: TabId) => void;
  onBrandEnquiry: () => void;
}) {
  const [one, two, three] = VALUE_FLOW;
  return (
    <section aria-labelledby="value-flow" className="space-y-10">
      <Reveal className="text-center space-y-2">
        <p className="text-xs font-bold tracking-[0.3em] uppercase text-champagne">How it works</p>
        <h2 id="value-flow" className="font-serif-display text-3xl md:text-5xl font-bold text-[#111]">The Award-to-Business Value Flow</h2>
        <p className="text-[15px] md:text-base text-[#2e2c29] max-w-2xl mx-auto">From recognition to branding support to paid brand deals.</p>
      </Reveal>
      <div className="relative">
      <Ribbons />
      <ol className="relative grid grid-cols-1 md:grid-cols-[1fr_1.25fr_1fr] gap-6 md:gap-8 items-stretch">

        <Reveal as="li" className="relative h-full flex flex-col items-center text-center gap-4 p-6 rounded-3xl bg-white/90 backdrop-blur border border-black/10 shadow-sm">
            <span className="relative flex items-end gap-2 h-24" aria-hidden="true">
              <span className="w-16 h-20 rounded-2xl bg-gradient-to-b from-[#f3dca6] to-[#b8893b] flex items-center justify-center shadow">
                <Trophy className="w-9 h-9 text-[#3b2a0c]" />
              </span>
              <span className="w-14 h-[4.5rem] rounded-xl bg-[#1e2a4a] flex items-center justify-center shadow">
                <ClipboardCheck className="w-7 h-7 text-white" />
              </span>
            </span>
            <h3 className="text-lg font-bold text-[#111]">1. {one.title}</h3>
            <p className="text-[15px] leading-relaxed text-[#2e2c29]">{one.text}</p>
            <TabLink tab="apply" onNavigate={onNavigate} className={`${linkButton} mt-auto bg-[#111] hover:bg-[#222] text-white`}>
              Apply for an award
            </TabLink>
        </Reveal>

        <Reveal as="li" delay={0.15} className="relative surface-dark relative h-full flex flex-col items-center text-center gap-4 p-6 md:p-8 rounded-[2.5rem] bg-gradient-to-b from-[#16233f] to-[#0b1426] text-white shadow-2xl ring-1 ring-[#E1C699]/40 overflow-hidden">
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-48 bg-[conic-gradient(from_180deg_at_50%_0%,transparent_40%,rgba(243,220,166,0.25)_50%,transparent_60%)]" />
            <Sparkle className="top-6 left-8 text-sm" />
            <Sparkle className="top-10 right-10 text-base" delay={1.2} />
            <span className="relative flex items-center gap-4" aria-hidden="true">
              <TrendingUp className="w-9 h-9 text-champagne" />
              <span className="relative shrink-0">
                {spotlight ? (
                  <Avatar creator={spotlight} className="w-24 h-24 rounded-full ring-4 ring-[#E1C699]/70" />
                ) : (
                  <span className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center"><Megaphone className="w-9 h-9" /></span>
                )}
              </span>
              {spotlight?.stats?.reach && (
                <span className="text-left shrink-0">
                  <span className="block font-serif-display text-2xl font-bold text-champagne leading-none">{String(spotlight.stats.reach)}+</span>
                  <span className="block text-[12px] text-[#e9e6df]">Followers</span>
                </span>
              )}
            </span>
            <h3 className="relative text-xl font-bold text-white">2. {two.title}</h3>
            <p className="relative text-[15px] leading-relaxed text-[#e9e6df]">{two.text}</p>
            {spotlight && <p className="relative text-[13px] text-[#cfcac0]">Spotlight: {spotlight.name}</p>}
            <TabLink tab="starindia" onNavigate={onNavigate} className={`${linkButton} relative mt-auto bg-[#E1C699] hover:bg-[#f3dca6] text-[#111]`}>
              Star India membership
            </TabLink>
        </Reveal>

        <Reveal as="li" delay={0.3} className="relative h-full flex flex-col items-center text-center gap-4 p-6 rounded-3xl bg-white/90 backdrop-blur border border-black/10 shadow-sm">
            <span className="relative h-24 flex items-end" aria-hidden="true">
              <span className="w-20 h-20 rounded-full bg-[#F6EFE3] flex items-center justify-center">
                <Handshake className="w-10 h-10 text-[#1e2a4a]" />
              </span>
              <span className="absolute -top-1 -right-6 px-2 py-0.5 rounded-full bg-[#8b2635] text-white text-[11px] font-bold">Brand</span>
              <span className="absolute -top-1 -left-6 w-8 h-8 rounded-full bg-[#1e2a4a] flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-white" />
              </span>
            </span>
            <h3 className="text-lg font-bold text-[#111]">3. {three.title}</h3>
            <p className="text-[15px] leading-relaxed text-[#2e2c29]">{three.text}</p>
            <button type="button" onClick={onBrandEnquiry} className={`${linkButton} mt-auto bg-[#111] hover:bg-[#222] text-white`}>
              <Briefcase className="w-4 h-4" aria-hidden="true" /> Send a brand enquiry
            </button>
        </Reveal>
      </ol>
      </div>
    </section>
  );
}

// ----------------------------------------------------
// Page
// ----------------------------------------------------
export default function HomeTab({ sections, onNavigate, onSelectCreator, onOpenGallerySection, onBrandEnquiry }: HomeTabProps) {
  const creators = useMemo(() => sections.flatMap((s) => s.creators || []).filter((c) => c && c.name), [sections]);
  const featured = creators.slice(0, 4);
  // The creator with the largest audience leads the "branding support" step
  const spotlight = useMemo(
    () => creators.reduce<Creator | undefined>((best, c) => (!best || parseReach(c.stats?.reach) > parseReach(best.stats?.reach) ? c : best), undefined),
    [creators]
  );

  return (
    <div className="w-full max-w-6xl mx-auto pt-4 md:pt-6 space-y-16 md:space-y-20">
      <div>
        <HeroSlider creators={creators} onNavigate={onNavigate} />
        <HomeSearch sections={sections} onNavigate={onNavigate} onSelectCreator={onSelectCreator} onOpenGallerySection={onOpenGallerySection} />
        <Reveal className="mt-10">
          <StatsStrip creators={creators} sections={sections} />
        </Reveal>
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

      <ValueFlow spotlight={spotlight} onNavigate={onNavigate} onBrandEnquiry={onBrandEnquiry} />

      {/* Featured awardees */}
      {featured.length > 0 && (
        <section aria-labelledby="featured-awardees" className="space-y-6">
          <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.3em] uppercase text-champagne">Awardees</p>
              <h2 id="featured-awardees" className="font-serif-display text-3xl md:text-4xl font-bold text-[#111] mt-1">Featured awardees</h2>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <TabLink tab="catwalk" onNavigate={onNavigate} className="text-sm font-semibold text-[#111] underline underline-offset-4 hover:no-underline">
                Walk the 3D gallery
              </TabLink>
              <TabLink tab="starindia" onNavigate={onNavigate} className="text-sm font-semibold text-[#111] underline underline-offset-4 hover:no-underline">
                All Star India profiles
              </TabLink>
            </div>
          </Reveal>
          <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {featured.map((c, i) => (
              <Reveal as="li" key={c.name} delay={i * 0.08}>
                <button
                  type="button"
                  onClick={() => onSelectCreator(c)}
                  aria-label={`View ${c.name}`}
                  className="group w-full text-left bg-white border border-black/10 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <span className="relative block overflow-hidden">
                    <Avatar creator={c} className="w-full aspect-[4/5] transition-transform duration-700 group-hover:scale-105" />
                    <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
                    <span aria-hidden="true" className="absolute top-3 right-3 w-9 h-9 rounded-full bg-gradient-to-b from-[#f3dca6] to-[#b8893b] shadow-lg flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-[#3b2a0c]" />
                    </span>
                    {c.stats?.reach && (
                      <span className="absolute left-3 bottom-3 text-white text-sm font-bold drop-shadow">{String(c.stats.reach)} followers</span>
                    )}
                  </span>
                  <span className="block p-4 space-y-1">
                    <span className="block font-serif-display text-base md:text-lg font-bold text-[#111] truncate">{c.name}</span>
                    <span className="block text-[13px] text-[#47453f] line-clamp-2">{c.role}</span>
                    <span className="inline-block font-mono text-[12px] text-[#2e2c29] bg-[#F3F3F1] px-2 py-0.5 rounded mt-1">{influencerId(c.name)}</span>
                  </span>
                </button>
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      {/* Ecosystem: Star India, Green Light, Contact */}
      <section aria-labelledby="ecosystem" className="space-y-8 pb-4">
        <Reveal className="text-center space-y-2">
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-champagne">The FSIA ecosystem</p>
          <h2 id="ecosystem" className="font-serif-display text-3xl md:text-4xl font-bold text-[#111]">Star India &amp; Green Light</h2>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Reveal>
            <TabLink tab="starindia" onNavigate={onNavigate} className="group surface-dark h-full flex flex-col bg-gradient-to-br from-[#1f5a3d] to-[#0f2e1f] text-white rounded-3xl p-6 gap-3 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              {/* Mini Influencer ID card */}
              <span aria-hidden="true" className="relative mx-auto w-40 rounded-2xl bg-white text-[#111] p-3 shadow-xl rotate-[-3deg] transition-transform duration-500 group-hover:rotate-0">
                <span className="flex justify-center">
                  {spotlight ? <Avatar creator={spotlight} className="w-14 h-14 rounded-full ring-2 ring-[#E1C699]" /> : <UserRound className="w-14 h-14" />}
                </span>
                <span className="block text-center text-[11px] font-bold mt-2">Influencer ID</span>
                <span className="block text-center font-mono text-[10px] text-[#47453f]">{spotlight ? influencerId(spotlight.name) : "FSIA-00000"}</span>
                <span className="mt-2 grid grid-cols-2 text-center text-[10px] border-t border-black/10 pt-1.5">
                  <span><b className="block text-[12px]">{spotlight?.stats?.reach ? String(spotlight.stats.reach) : "—"}</b>Reach</span>
                  <span><b className="block text-[12px]">{spotlight?.stats?.engagement ? String(spotlight.stats.engagement) : "—"}</b>Engage</span>
                </span>
              </span>
              <span className="block font-serif-display text-2xl font-bold mt-2">Star India</span>
              <span className="block text-[15px] text-[#e9e6df]">Star India runs membership and Influencer ID profiles for awardees and verified creators.</span>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-champagne">Membership &amp; profiles <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
            </TabLink>
          </Reveal>
          <Reveal delay={0.1}>
            <TabLink tab="greenlight" onNavigate={onNavigate} className="group surface-dark h-full flex flex-col bg-gradient-to-br from-[#1e2a4a] to-[#0b1426] text-white rounded-3xl p-6 gap-3 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              {/* Mini magazine cover */}
              <span aria-hidden="true" className="relative mx-auto w-32 aspect-[3/4] rounded-lg overflow-hidden shadow-xl rotate-[3deg] transition-transform duration-500 group-hover:rotate-0 bg-[#123524]">
                {spotlight && <Avatar creator={spotlight} className="absolute inset-0 w-full h-full opacity-80" />}
                <span className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />
                <span className="absolute top-2 inset-x-0 text-center font-serif-display text-xl font-bold text-[#f3dca6] leading-none">EXPLORE</span>
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#E1C699] text-[#111] text-[9px] font-bold">BOOK NOW</span>
              </span>
              <span className="block font-serif-display text-2xl font-bold mt-2">Green Light</span>
              <span className="block text-[15px] text-[#e9e6df]">Green Light runs the FSIA blog and Explore Magazine, including cover and feature bookings.</span>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-champagne">Blog, magazine &amp; booking <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
            </TabLink>
          </Reveal>
          <Reveal delay={0.2}>
            <TabLink tab="contact" onNavigate={onNavigate} className="group h-full flex flex-col bg-white border border-black/10 rounded-3xl p-6 gap-3 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              {/* Mini form */}
              <span aria-hidden="true" className="mx-auto w-44 rounded-xl border border-black/10 bg-[#FAF9F6] p-3 space-y-1.5 shadow-sm">
                <span className="grid grid-cols-2 gap-1.5"><span className="h-3 rounded bg-white border border-black/10" /><span className="h-3 rounded bg-white border border-black/10" /></span>
                <span className="block h-3 rounded bg-white border border-black/10" />
                <span className="block h-8 rounded bg-white border border-black/10" />
                <span className="block w-12 h-3 rounded bg-[#E1C699] ml-auto" />
              </span>
              <span className="block font-serif-display text-2xl font-bold text-[#111] mt-2">Contact</span>
              <span className="block text-[15px] text-[#2e2c29]">Questions about awards, membership or brand deals? Send us a message and we'll reply by email.</span>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-[#111]">Contact form <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
            </TabLink>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
