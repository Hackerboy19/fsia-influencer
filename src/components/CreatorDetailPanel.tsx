import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { X, Link2, Check, ChevronLeft, ChevronRight, Heart, Info, CalendarCheck, MapPin, Images, Instagram, Youtube, Facebook, Twitter, Linkedin, Globe } from "lucide-react";
import type { SocialId } from "../lib/social";

const SOCIAL_ICONS: Record<SocialId, typeof Globe> = { instagram: Instagram, youtube: Youtube, facebook: Facebook, x: Twitter, linkedin: Linkedin, website: Globe };
import toast from "react-hot-toast";
import type { ProfileView } from "../lib/profile";
import { profileHref } from "../lib/profileLink";
import { useDialog, Portal } from "../lib/dialog";
import Photo from "./Photo";
import ProfileCard from "./ProfileCard";
import { initials } from "../lib/profile";

interface CreatorDetailPanelProps {
  key?: string;
  profile: ProfileView;
  onClose: () => void;
  onOpenCollaboration: () => void;
  onReport: () => void;
  moodboardItems?: string[];
  /** Other profiles in the same category, shown at the end */
  related?: ProfileView[];
  /** True when the built-in sample list is shown (no live directory) */
  sample?: boolean;
  onOpenProfile?: (profile: ProfileView) => void;
}

const firstName = (name: string) => name.replace(/^(Dr\.?|Mr\.?|Ms\.?|Mrs\.?)\s+/i, "").split(" ")[0] || name;

// The public profile. Its layout follows the content: sections without data are left out
// rather than shown empty, and nothing is added that the creator or the team did not enter.
export default function CreatorDetailPanel({ profile, onClose, onOpenCollaboration, onReport, moodboardItems = [], related = [], sample = false, onOpenProfile }: CreatorDetailPanelProps) {
  const reduced = useReducedMotion();
  const panelRef = useDialog<HTMLDivElement>(true, onClose);
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const lightboxRef = useDialog<HTMLDivElement>(photoIndex !== null, () => setPhotoIndex(null));
  const [copied, setCopied] = useState(false);

  const p = profile;
  const hasAudience = !!(p.reach || p.engagement);
  // Gallery: the main portrait first, then the creator's other photos
  const photos = [p.image, ...p.portfolio].filter((u, i, a) => !!u && a.indexOf(u) === i);
  const current = photoIndex !== null ? photos[photoIndex] : null;
  const step = (d: number) => setPhotoIndex((i) => (i === null ? i : (i + d + photos.length) % photos.length));

  // Lightbox: arrow keys and swipe move between photos
  useEffect(() => {
    if (photoIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const touchX = useRef<number | null>(null);

  const copyLink = async () => {
    const url = window.location.origin + profileHref(p.slug);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Copy this link: " + url);
    }
  };

  const stats = [
    p.reach && { label: "Followers", value: p.reach, big: true },
    p.engagement && { label: "Engagement", value: p.engagement, big: true },
    p.city && { label: "Based in", value: p.city },
    p.category && { label: "Category", value: p.category }
  ].filter(Boolean) as { label: string; value: string; big?: boolean }[];

  return (
    <Portal>
      <div className="fixed inset-0 z-[55] bg-ink/50" onClick={onClose}>
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-name"
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="absolute inset-0 bg-paper overflow-y-auto outline-none"
          id="creator-detail-panel-container"
        >
          {/* Top bar: breadcrumb back to the directory, the main action, close */}
          <div className="sticky top-0 z-20 bg-paper/95 backdrop-blur border-b border-line">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 px-5 md:px-8 h-14">
              <nav aria-label="Breadcrumb" className="min-w-0 text-[0.875rem] text-ink-3">
                <ol className="flex items-center gap-1.5 min-w-0">
                  <li>
                    <button type="button" onClick={onClose} className="inline-flex items-center gap-1 text-ink-2 hover:text-ink underline-offset-4 hover:underline cursor-pointer">
                      <ChevronLeft className="w-4 h-4" aria-hidden="true" /> All profiles
                    </button>
                  </li>
                  <li aria-hidden="true">/</li>
                  <li className="truncate text-ink" aria-current="page">{p.name}</li>
                </ol>
              </nav>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={onOpenCollaboration} className="btn btn-sm btn-primary mr-1" id="profile-book-top-btn">
                  <CalendarCheck className="w-4 h-4" aria-hidden="true" /> <span className="hidden sm:inline">Book {firstName(p.name)}</span><span className="sm:hidden">Book</span>
                </button>
                {moodboardItems.length > 0 && (
                  <button type="button" onClick={() => window.dispatchEvent(new Event("open-moodboard"))} className="btn btn-sm text-ink-2 hover:text-ink hidden sm:inline-flex">
                    <Heart className="w-4 h-4" aria-hidden="true" /> Saved ({moodboardItems.length})
                  </button>
                )}
                <button type="button" onClick={onClose} aria-label="Close profile" id="close-creator-details-btn" className="w-10 h-10 inline-flex items-center justify-center rounded-[4px] text-ink hover:bg-sunken cursor-pointer">
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Cover: a dark editorial band with the name, and the portrait standing over its lower edge */}
          <header className="bg-ink text-paper">
            <div className={`max-w-6xl mx-auto px-5 md:px-8 grid gap-8 md:gap-14 ${p.image ? "md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]" : ""}`}>
              {p.image && (
                <div className="md:order-2 pt-6 md:pt-12 -mb-0 md:-mb-24 relative z-10">
                  <button type="button" onClick={() => setPhotoIndex(0)} className="block w-full cursor-zoom-in" aria-label={`Open ${p.name}'s photos`}>
                    <Photo src={p.image} name={p.name} eager alt={`Portrait of ${p.name}`} ratio="aspect-[4/5]" className="shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]" sizes="(min-width: 768px) 420px, 100vw" />
                  </button>
                  {photos.length > 1 && (
                    <a href="#profile-gallery" className="mt-3 md:mt-0 md:absolute md:left-4 md:bottom-4 inline-flex items-center gap-2 bg-paper/95 text-ink text-[0.8125rem] font-semibold px-3 py-2 hover:bg-white">
                      <Images className="w-4 h-4" aria-hidden="true" /> {photos.length} photos
                    </a>
                  )}
                </div>
              )}
              <div className="md:order-1 min-w-0 pb-10 md:py-16 flex flex-col justify-center">
                {!p.image && (
                  <span aria-hidden="true" className="w-20 h-20 mb-6 inline-flex items-center justify-center bg-white/10 font-display text-[1.75rem] text-paper">{initials(p.name)}</span>
                )}
                <p className="text-[0.875rem] font-semibold text-[#E1C699]">
                  {[p.category, p.role].filter(Boolean).join(" · ") || "Creator profile"}
                </p>
                <h2 id="profile-name" className="mt-4 font-display font-medium tracking-[-0.02em] text-paper text-[2.75rem] sm:text-[3.5rem] md:text-[4.5rem] leading-[0.98] break-words">
                  {p.name}
                </h2>
                {p.city && (
                  <p className="mt-4 inline-flex items-center gap-1.5 text-[1.0625rem] text-paper/75">
                    <MapPin className="w-4 h-4" aria-hidden="true" /> {p.city}, India
                  </p>
                )}
                {p.social.length > 0 && (
                  <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2" aria-label={`${p.name} on social media`} id="profile-social">
                    {p.social.map((s) => {
                      const Icon = SOCIAL_ICONS[s.id];
                      return (
                        <li key={s.id}>
                          <a href={s.url} target="_blank" rel="noopener noreferrer nofollow"
                            className="inline-flex items-center gap-2 text-[0.9375rem] text-paper/85 hover:text-paper underline-offset-4 hover:underline">
                            <Icon className="w-4 h-4 text-[#E1C699]" aria-hidden="true" />
                            <span className="sr-only">{s.label}: </span>{s.text}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {p.quote && (
                  <blockquote className="mt-8 max-w-xl font-display italic text-[1.375rem] md:text-[1.625rem] leading-snug text-paper/90">
                    “{p.quote}”
                  </blockquote>
                )}
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={onOpenCollaboration} className="btn btn-primary h-12 px-6" id="profile-book-btn">
                    <CalendarCheck className="w-4 h-4" aria-hidden="true" /> Book or enquire
                  </button>
                  <button type="button" onClick={copyLink} className="btn h-12 px-5 text-paper border border-paper/40 hover:border-paper" aria-live="polite">
                    {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Link2 className="w-4 h-4" aria-hidden="true" />}
                    {copied ? "Link copied" : "Share profile"}
                  </button>
                </div>
                {sample ? (
                  <p className="mt-6 inline-flex items-start gap-2 text-[0.875rem] text-paper/80">
                    <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" /> Sample profile for this preview. It is not a real creator.
                  </p>
                ) : p.reviewed ? (
                  <p className="mt-6 inline-flex items-start gap-2 text-[0.875rem] text-paper/80">
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-[#E1C699]" aria-hidden="true" />
                    <span>
                      Reviewed profile: our team approved it before it went live.{" "}
                      <a href="/faq/" className="underline underline-offset-4 hover:text-paper">What this means</a>
                    </span>
                  </p>
                ) : null}
              </div>
            </div>
          </header>

          {/* Key facts in one ruled row */}
          {stats.length > 0 && (
            <section aria-labelledby="profile-audience" className="max-w-6xl mx-auto px-5 md:px-8">
              <h3 id="profile-audience" className="sr-only">Key facts</h3>
              <div className={p.image ? "md:pr-[calc(41.666%+1.5rem)]" : ""}>
                <dl className="grid grid-cols-2 sm:grid-cols-4 border-b border-line">
                  {stats.map((st) => (
                    <div key={st.label} className="py-6 pr-4 border-t sm:border-t-0 border-line first:border-t-0 [&:nth-child(2)]:border-t-0">
                      <dt className="text-[0.8125rem] text-ink-3">{st.label}</dt>
                      <dd className={`mt-1 text-ink ${st.big ? "font-display text-[2.25rem] leading-none tabular-nums" : "text-[1.0625rem] font-medium leading-snug pt-2"}`}>{st.value}</dd>
                    </div>
                  ))}
                </dl>
                {hasAudience && <p className="mt-3 text-[0.8125rem] text-ink-3">Audience figures are supplied by the creator and are not independently audited.</p>}
              </div>
            </section>
          )}

          {/* About, details and the enquiry */}
          <div className="max-w-6xl mx-auto px-5 md:px-8 pt-12 md:pt-16 pb-12 grid gap-10 md:gap-14 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <div className="space-y-10 min-w-0">
              {p.bio && (
                <section aria-labelledby="profile-about">
                  <h3 id="profile-about" className="text-[0.875rem] font-semibold text-bronze">About {firstName(p.name)}</h3>
                  <p className="mt-3 font-display text-[1.375rem] md:text-[1.5rem] leading-[1.45] text-ink whitespace-pre-line">{p.bio}</p>
                </section>
              )}
              {p.facts.length > 0 && (
                <section aria-labelledby="profile-facts">
                  <h3 id="profile-facts" className="text-[0.875rem] font-semibold text-bronze">Details</h3>
                  <dl className="mt-3 divide-y divide-line border-y border-line">
                    {p.facts.map((f) => (
                      <div key={f.label} className="grid grid-cols-[8rem_1fr] sm:grid-cols-[11rem_1fr] gap-4 py-3.5">
                        <dt className="text-ink-3">{f.label}</dt>
                        <dd className="text-ink break-words">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}
            </div>

            <aside className="md:sticky md:top-20 self-start space-y-4">
              <section aria-labelledby="profile-enquire" className="bg-surface border border-line p-6 md:p-7">
                <h3 id="profile-enquire" className="font-display text-[1.5rem] leading-snug text-ink">Work with {firstName(p.name)}</h3>
                <ol className="mt-5 space-y-4">
                  {[
                    ["Send a short brief", "What you need, when, and your budget range."],
                    ["We speak to the creator", "Our team checks interest and availability for you."],
                    ["You hear back", "By email or phone, usually within a few working days."]
                  ].map(([t, d], i) => (
                    <li key={t} className="grid grid-cols-[1.75rem_1fr] gap-3">
                      <span className="font-display text-[1.125rem] text-bronze tabular-nums leading-6">{i + 1}</span>
                      <span>
                        <span className="block font-semibold text-ink">{t}</span>
                        <span className="block text-[0.9375rem] text-ink-3">{d}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                <button type="button" onClick={onOpenCollaboration} className="btn btn-primary w-full h-12 mt-6" id="initiate-charter-btn">
                  Send an enquiry
                </button>
                <p className="mt-3 text-[0.8125rem] text-ink-3">Creators' email and phone numbers are never published.</p>
              </section>
              <p className="text-[0.875rem] text-ink-3">
                Is something on this profile wrong?{" "}
                <button type="button" onClick={onReport} className="link font-normal cursor-pointer">Ask for a correction</button>
              </p>
            </aside>
          </div>

          {/* Portfolio: every photo at its own shape, in columns */}
          {photos.length > 1 && (
            <section id="profile-gallery" aria-labelledby="profile-work" className="border-t border-line scroll-mt-16">
              <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-16">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 id="profile-work" className="font-display text-[2rem] md:text-[2.5rem] leading-tight text-ink">Portfolio</h3>
                  <span className="text-[0.875rem] text-ink-3 tabular-nums">{photos.length} photos</span>
                </div>
                <ul className={`mt-8 grid grid-cols-2 gap-3 md:gap-4 ${photos.length === 3 ? "md:grid-cols-3" : photos.length === 4 ? "md:grid-cols-4" : photos.length === 2 ? "" : "md:grid-cols-3"}`}>
                  {photos.map((src, i) => (
                    <li key={src}>
                      <button
                        type="button"
                        onClick={() => setPhotoIndex(i)}
                        aria-label={`Open photo ${i + 1} of ${photos.length}`}
                        className="group block w-full overflow-hidden cursor-zoom-in"
                      >
                        <Photo src={src} name={p.name} ratio="aspect-[4/5]" className="[&_img]:transition-transform [&_img]:duration-500 group-hover:[&_img]:scale-[1.03]" sizes="(min-width: 768px) 300px, 50vw" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {related.length > 0 && onOpenProfile && (
            <section aria-labelledby="profile-related" className="border-t border-line bg-surface">
              <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-14">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 id="profile-related" className="font-display text-[1.75rem] text-ink">More in {p.category}</h3>
                  <button type="button" onClick={onClose} className="link cursor-pointer">Back to all profiles</button>
                </div>
                <ul className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
                  {related.map((r) => (
                    <li key={r.slug}>
                      <ProfileCard profile={r} onOpen={onOpenProfile} headingLevel="h3" sizes="(min-width: 768px) 260px, 45vw" />
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </motion.div>
      </div>

      {current && (
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${p.name}: photo ${photoIndex! + 1} of ${photos.length}`}
          tabIndex={-1}
          onClick={() => setPhotoIndex(null)}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
          }}
          className="fixed inset-0 z-[100] bg-[#121110]/95 flex flex-col items-center justify-center p-4 outline-none"
        >
          <div className="absolute top-4 right-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("toggle-moodboard", { detail: current }))}
              aria-pressed={moodboardItems.includes(current)}
              className="btn btn-sm text-white border border-white/30 hover:border-white"
            >
              <Heart className={`w-4 h-4 ${moodboardItems.includes(current) ? "fill-current" : ""}`} aria-hidden="true" />
              {moodboardItems.includes(current) ? "Saved" : "Save photo"}
            </button>
            <button type="button" onClick={() => setPhotoIndex(null)} aria-label="Close photo" className="w-10 h-10 inline-flex items-center justify-center text-white hover:bg-white/10 rounded-[4px] cursor-pointer">
              <X className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>
          <img
            src={current}
            alt={`${p.name}: photo ${photoIndex! + 1} of ${photos.length}`}
            onClick={(e) => e.stopPropagation()}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[72vh] object-contain"
          />
          {photos.length > 1 && (
            <div className="mt-4 flex items-center gap-4 text-white" onClick={(e) => e.stopPropagation()}>
              <button type="button" aria-label="Previous photo" onClick={() => step(-1)} className="w-10 h-10 inline-flex items-center justify-center hover:bg-white/10 rounded-[4px] cursor-pointer">
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>
              <span className="text-sm tabular-nums">{photoIndex! + 1} / {photos.length}</span>
              <button type="button" aria-label="Next photo" onClick={() => step(1)} className="w-10 h-10 inline-flex items-center justify-center hover:bg-white/10 rounded-[4px] cursor-pointer">
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          )}
          {photos.length > 1 && (
            <ul className="mt-3 flex gap-2 max-w-full overflow-x-auto scrollbar-none px-1" onClick={(e) => e.stopPropagation()} aria-label="All photos">
              {photos.map((src, i) => (
                <li key={src} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setPhotoIndex(i)}
                    aria-label={`Photo ${i + 1}`}
                    aria-current={i === photoIndex ? "true" : undefined}
                    className={`block w-14 h-14 overflow-hidden rounded-[2px] border-2 cursor-pointer ${i === photoIndex ? "border-white" : "border-transparent opacity-60 hover:opacity-100"}`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Portal>
  );
}
