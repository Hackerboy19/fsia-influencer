import React, { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { X, Link2, Check, ChevronLeft, ChevronRight, Heart, Info } from "lucide-react";
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
  const subtitle = [p.role, p.city].filter(Boolean).join(" · ");
  const hasAudience = !!(p.reach || p.engagement);
  const photos = p.portfolio;
  const current = photoIndex !== null ? photos[photoIndex] : null;

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

          <div className={`grid gap-8 md:gap-12 px-5 md:px-10 py-8 md:py-10 ${p.image ? "md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]" : ""}`}>
            {/* A strong portrait when there is one; profiles without a photo get a compact monogram instead of an empty frame */}
            {p.image && (
              <div className="md:sticky md:top-20 self-start">
                <Photo src={p.image} name={p.name} eager alt={`Portrait of ${p.name}`} ratio="aspect-[4/5]" className="rounded-[2px]" sizes="(min-width: 768px) 420px, 100vw" />
              </div>
            )}

            <div className="space-y-9 min-w-0 max-w-2xl">
              <header className="space-y-3">
                {!p.image && (
                  <span aria-hidden="true" className="w-20 h-20 mb-2 inline-flex items-center justify-center bg-sunken font-display text-[1.75rem] text-ink-3 rounded-[2px]">{initials(p.name)}</span>
                )}
                {p.category && <p className="eyebrow">{p.category}</p>}
                <h2 id="profile-name" className="display text-[2.25rem] md:text-[3rem] leading-[1.02]">{p.name}</h2>
                {subtitle && <p className="text-[1.125rem] text-ink-2">{subtitle}</p>}
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
                <section aria-labelledby="profile-audience" className="space-y-2">
                  <h3 id="profile-audience" className="sr-only">Audience</h3>
                  <dl className="grid grid-cols-2 border-y border-line divide-x divide-line">
                    {p.reach && (
                      <div className="py-4 pr-4">
                        <dt className="text-[0.8125rem] text-ink-3">Followers</dt>
                        <dd className="font-display text-[2rem] leading-tight text-ink tabular-nums">{p.reach}</dd>
                      </div>
                    )}
                    {p.engagement && (
                      <div className={`py-4 ${p.reach ? "pl-4" : "pr-4"}`}>
                        <dt className="text-[0.8125rem] text-ink-3">Engagement rate</dt>
                        <dd className="font-display text-[2rem] leading-tight text-ink tabular-nums">{p.engagement}</dd>
                      </div>
                    )}
                  </dl>
                  <p className="text-[0.8125rem] text-ink-3">Supplied by the creator; not independently audited.</p>
                </section>
              )}

              {p.bio && (
                <section aria-labelledby="profile-about" className="space-y-2">
                  <h3 id="profile-about" className="label-caps">About</h3>
                  <p className="text-[1.0625rem] leading-relaxed text-ink-2 whitespace-pre-line">{p.bio}</p>
                </section>
              )}

              {p.quote && (
                <figure className="border-l-2 border-bronze pl-5">
                  <blockquote className="font-display text-[1.375rem] leading-snug text-ink">“{p.quote}”</blockquote>
                </figure>
              )}

              {p.facts.length > 0 && (
                <section aria-labelledby="profile-facts" className="space-y-2">
                  <h3 id="profile-facts" className="label-caps">Details</h3>
                  <dl className="divide-y divide-line border-y border-line">
                    {p.facts.map((f) => (
                      <div key={f.label} className="grid grid-cols-[9rem_1fr] gap-4 py-3">
                        <dt className="text-ink-3">{f.label}</dt>
                        <dd className="text-ink">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              {photos.length > 0 && (
                <section aria-labelledby="profile-work" className="space-y-3">
                  <h3 id="profile-work" className="label-caps">Selected work</h3>
                  <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {photos.map((src, i) => (
                      <li key={src}>
                        <button
                          type="button"
                          onClick={() => setPhotoIndex(i)}
                          aria-label={`Open photo ${i + 1} of ${photos.length}`}
                          className="block w-full cursor-zoom-in"
                        >
                          <Photo src={src} name={p.name} ratio="aspect-[4/5]" className="rounded-[2px]" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

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
            className="max-w-full max-h-[80vh] object-contain"
          />
          {photos.length > 1 && (
            <div className="mt-4 flex items-center gap-4 text-white" onClick={(e) => e.stopPropagation()}>
              <button type="button" aria-label="Previous photo" onClick={() => setPhotoIndex((photoIndex! - 1 + photos.length) % photos.length)} className="w-10 h-10 inline-flex items-center justify-center hover:bg-white/10 rounded-[4px] cursor-pointer">
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>
              <span className="text-sm tabular-nums">{photoIndex! + 1} / {photos.length}</span>
              <button type="button" aria-label="Next photo" onClick={() => setPhotoIndex((photoIndex! + 1) % photos.length)} className="w-10 h-10 inline-flex items-center justify-center hover:bg-white/10 rounded-[4px] cursor-pointer">
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      )}
    </Portal>
  );
}
