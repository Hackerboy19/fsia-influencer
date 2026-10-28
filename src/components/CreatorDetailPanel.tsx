import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { X, Link2, Check, ChevronLeft, ChevronRight, Heart, Info, CalendarCheck, MapPin, Images } from "lucide-react";
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

  return (
    <Portal>
      <div className="fixed inset-0 z-[55] flex justify-center items-stretch md:items-start md:py-10 bg-ink/40" onClick={onClose}>
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-name"
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full md:max-w-5xl md:mx-6 bg-paper md:rounded-[4px] md:border md:border-line shadow-[0_20px_60px_-20px_rgba(27,26,23,0.35)] overflow-y-auto outline-none"
          id="creator-detail-panel-container"
        >
          {/* Top bar: breadcrumb back to the directory, share, close */}
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 md:px-8 h-14 bg-paper/95 backdrop-blur border-b border-line">
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
              {/* Always visible while scrolling: the main action on a profile */}
              <button type="button" onClick={onOpenCollaboration} className="btn btn-sm btn-primary mr-1" id="profile-book-top-btn">
                <CalendarCheck className="w-4 h-4" aria-hidden="true" /> <span className="hidden sm:inline">Book {firstName(p.name)}</span><span className="sm:hidden">Book</span>
              </button>
              {moodboardItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event("open-moodboard"))}
                  className="btn btn-sm text-ink-2 hover:text-ink"
                >
                  <Heart className="w-4 h-4" aria-hidden="true" /> Saved ({moodboardItems.length})
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close profile"
                id="close-creator-details-btn"
                className="w-10 h-10 inline-flex items-center justify-center rounded-[4px] text-ink hover:bg-sunken cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Header: portrait with a strip of gallery photos, then name, facts and the main action */}
          <div className={`grid gap-8 md:gap-10 px-5 md:px-10 pt-6 md:pt-10 pb-8 ${p.image ? "md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]" : ""}`}>
            {p.image && (
              <div className="space-y-2 min-w-0">
                <button type="button" onClick={() => setPhotoIndex(0)} className="block w-full cursor-zoom-in" aria-label={`Open ${p.name}'s photos`}>
                  <Photo src={p.image} name={p.name} eager alt={`Portrait of ${p.name}`} ratio="aspect-[4/5]" className="rounded-[3px]" sizes="(min-width: 768px) 440px, 100vw" />
                </button>
                {photos.length > 1 && (
                  <ul className="grid grid-cols-5 gap-2" aria-label="More photos">
                    {photos.slice(1, 5).map((src, i) => (
                      <li key={src}>
                        <button type="button" onClick={() => setPhotoIndex(i + 1)} className="block w-full cursor-zoom-in" aria-label={`Open photo ${i + 2} of ${photos.length}`}>
                          <Photo src={src} name={p.name} ratio="aspect-square" className="rounded-[2px]" sizes="90px" />
                        </button>
                      </li>
                    ))}
                    <li>
                      <a href="#profile-gallery" className="h-full aspect-square flex flex-col items-center justify-center gap-1 rounded-[2px] border border-line bg-surface text-[0.8125rem] font-semibold text-ink hover:border-ink">
                        <Images className="w-4 h-4" aria-hidden="true" /> {photos.length}
                        <span className="sr-only">photos: see the gallery</span>
                      </a>
                    </li>
                  </ul>
                )}
              </div>
            )}

            <div className="space-y-6 min-w-0 md:pt-2">
              <header className="space-y-3">
                {!p.image && (
                  <span aria-hidden="true" className="w-20 h-20 mb-2 inline-flex items-center justify-center bg-sunken font-display text-[1.75rem] text-ink-3 rounded-[2px]">{initials(p.name)}</span>
                )}
                {p.category && <p className="eyebrow">{p.category}</p>}
                <h2 id="profile-name" className="display text-[2.5rem] md:text-[3.25rem] leading-[1.02]">{p.name}</h2>
                {(p.role || p.city) && (
                  <p className="text-[1.125rem] text-ink-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {p.role && <span>{p.role}</span>}
                    {p.city && (
                      <span className="inline-flex items-center gap-1 text-ink-3">
                        <MapPin className="w-4 h-4" aria-hidden="true" /> {p.city}
                      </span>
                    )}
                  </p>
                )}
                {sample ? (
                  <p className="flex items-start gap-2 border border-line-strong bg-bronze-soft px-3 py-2 text-[0.875rem] text-ink">
                    <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                    <span>Sample profile for this preview. It is not a real creator.</span>
                  </p>
                ) : p.reviewed ? (
                  <p className="text-[0.875rem] text-ink-2 flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-bronze shrink-0" aria-hidden="true" />
                    <span>
                      <strong className="font-semibold text-ink">Reviewed:</strong> our team read the application and approved this profile before it was published.
                      Audience figures are not audited.{" "}
                      <a href="/faq/" className="link font-normal">What this means</a>
                    </span>
                  </p>
                ) : null}
              </header>

              {hasAudience && (
                <section aria-labelledby="profile-audience" className="space-y-1.5">
                  <h3 id="profile-audience" className="sr-only">Audience</h3>
                  <dl className="grid grid-cols-2 bg-surface border border-line rounded-[3px] divide-x divide-line">
                    {p.reach && (
                      <div className="px-4 py-3">
                        <dt className="text-[0.8125rem] text-ink-3">Followers</dt>
                        <dd className="font-display text-[2rem] leading-tight text-ink tabular-nums">{p.reach}</dd>
                      </div>
                    )}
                    {p.engagement && (
                      <div className="px-4 py-3">
                        <dt className="text-[0.8125rem] text-ink-3">Engagement rate</dt>
                        <dd className="font-display text-[2rem] leading-tight text-ink tabular-nums">{p.engagement}</dd>
                      </div>
                    )}
                  </dl>
                  <p className="text-[0.8125rem] text-ink-3">Supplied by the creator; not independently audited.</p>
                </section>
              )}

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" onClick={onOpenCollaboration} className="btn btn-primary h-12 px-6" id="profile-book-btn">
                    <CalendarCheck className="w-4 h-4" aria-hidden="true" /> Book or enquire
                  </button>
                  <button type="button" onClick={copyLink} className="btn btn-secondary h-12">
                    {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Link2 className="w-4 h-4" aria-hidden="true" />}
                    {copied ? "Link copied" : "Share profile"}
                  </button>
                </div>
                <p className="text-[0.8125rem] text-ink-3">Our team contacts the creator for you and replies by email or phone.</p>
              </div>

              {p.quote && (
                <figure className="border-l-2 border-bronze pl-5">
                  <blockquote className="font-display text-[1.375rem] leading-snug text-ink">“{p.quote}”</blockquote>
                </figure>
              )}
            </div>
          </div>

          {/* Gallery: every photo, the first one larger */}
          {photos.length > 1 && (
            <section id="profile-gallery" aria-labelledby="profile-work" className="px-5 md:px-10 pb-10 scroll-mt-16">
              <div className="flex items-baseline justify-between gap-3 border-t border-line pt-8">
                <h3 id="profile-work" className="font-display text-[1.75rem] text-ink">Gallery</h3>
                <span className="text-[0.875rem] text-ink-3 tabular-nums">{photos.length} photos</span>
              </div>
              <ul className="mt-5 grid grid-cols-2 md:grid-cols-4 auto-rows-[9.5rem] sm:auto-rows-[12rem] gap-2">
                {photos.map((src, i) => (
                  <li key={src} className={i === 0 ? "col-span-2 row-span-2" : ""}>
                    <button
                      type="button"
                      onClick={() => setPhotoIndex(i)}
                      aria-label={`Open photo ${i + 1} of ${photos.length}`}
                      className="group block w-full h-full overflow-hidden rounded-[3px] cursor-zoom-in bg-sunken"
                    >
                      <Photo src={src} name={p.name} ratio="h-full w-full" className="transition-transform duration-300 group-hover:scale-[1.03]" sizes={i === 0 ? "(min-width: 768px) 480px, 100vw" : "(min-width: 768px) 240px, 50vw"} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* About, details and the enquiry */}
          <div className="grid gap-8 md:gap-12 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] px-5 md:px-10 pb-10 border-t border-line pt-8">
            <div className="space-y-8 min-w-0">
              {p.bio && (
                <section aria-labelledby="profile-about" className="space-y-2">
                  <h3 id="profile-about" className="font-display text-[1.5rem] text-ink">About {firstName(p.name)}</h3>
                  <p className="text-[1.0625rem] leading-relaxed text-ink-2 whitespace-pre-line">{p.bio}</p>
                </section>
              )}

              {p.facts.length > 0 && (
                <section aria-labelledby="profile-facts" className="space-y-2">
                  <h3 id="profile-facts" className="font-display text-[1.5rem] text-ink">Details</h3>
                  <dl className="divide-y divide-line border-y border-line">
                    {p.facts.map((f) => (
                      <div key={f.label} className="grid grid-cols-[8rem_1fr] sm:grid-cols-[10rem_1fr] gap-4 py-3">
                        <dt className="text-ink-3">{f.label}</dt>
                        <dd className="text-ink break-words">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}
            </div>

            <div className="space-y-4 md:sticky md:top-20 self-start">
              <section aria-labelledby="profile-enquire" className="panel p-5 md:p-6 space-y-3">
                <h3 id="profile-enquire" className="font-display text-[1.375rem] leading-snug text-ink">Work with {firstName(p.name)}</h3>
                <p className="text-[0.9375rem] text-ink-2">
                  Enquiries go to our team, who contact the creator for you. Creators' email and phone numbers are never published.
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <button type="button" onClick={onOpenCollaboration} className="btn btn-primary" id="initiate-charter-btn">
                    Send an enquiry
                  </button>
                  <button type="button" onClick={copyLink} className="btn btn-secondary" aria-live="polite">
                    {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Link2 className="w-4 h-4" aria-hidden="true" />}
                    {copied ? "Link copied" : "Copy profile link"}
                  </button>
                </div>
              </section>
              <p className="text-[0.875rem] text-ink-3">
                Is something on this profile wrong?{" "}
                <button type="button" onClick={onReport} className="link font-normal cursor-pointer">Ask for a correction</button>
              </p>
            </div>
          </div>

          {related.length > 0 && onOpenProfile && (
            <section aria-labelledby="profile-related" className="border-t border-line bg-surface px-5 md:px-10 py-8 md:py-10">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 id="profile-related" className="font-display text-[1.5rem] text-ink">More in {p.category}</h3>
                <button type="button" onClick={onClose} className="link cursor-pointer">Back to all profiles</button>
              </div>
              <ul className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
                {related.map((r) => (
                  <li key={r.slug}>
                    <ProfileCard profile={r} onOpen={onOpenProfile} headingLevel="h3" sizes="(min-width: 768px) 220px, 45vw" />
                  </li>
                ))}
              </ul>
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
