import React, { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { X, Link2, Check, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import toast from "react-hot-toast";
import type { ProfileView } from "../lib/profile";
import { profileHref } from "../lib/profileLink";
import { useDialog, Portal } from "../lib/dialog";
import Photo from "./Photo";

interface CreatorDetailPanelProps {
  key?: string;
  profile: ProfileView;
  onClose: () => void;
  onOpenCollaboration: () => void;
  onReport: () => void;
  moodboardItems?: string[];
}

const firstName = (name: string) => name.replace(/^(Dr\.?|Mr\.?|Ms\.?|Mrs\.?)\s+/i, "").split(" ")[0] || name;

// The public profile. Its layout follows the content: sections without data are left out
// rather than shown empty, and nothing is added that the creator or the team did not enter.
export default function CreatorDetailPanel({ profile, onClose, onOpenCollaboration, onReport, moodboardItems = [] }: CreatorDetailPanelProps) {
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
                  <button type="button" onClick={onClose} className="hover:text-ink underline-offset-4 hover:underline cursor-pointer">
                    Profiles
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
              <button type="button" onClick={copyLink} className="btn btn-sm text-ink-2 hover:text-ink" aria-live="polite">
                {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Link2 className="w-4 h-4" aria-hidden="true" />}
                <span className="hidden sm:inline">{copied ? "Link copied" : "Copy link"}</span>
                <span className="sm:hidden sr-only">{copied ? "Link copied" : "Copy profile link"}</span>
              </button>
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

          <div className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 md:gap-12 px-5 md:px-8 py-8 md:py-10">
            <div className="md:sticky md:top-20 self-start">
              <Photo src={p.image} name={p.name} eager alt={`Portrait of ${p.name}`} className="rounded-[2px]" sizes="(min-width: 768px) 400px, 100vw" />
            </div>

            <div className="space-y-8 min-w-0">
              <header className="space-y-3">
                {p.category && <p className="eyebrow">{p.category}</p>}
                <h2 id="profile-name" className="display text-[2.25rem] md:text-[2.75rem] leading-[1.05]">{p.name}</h2>
                {subtitle && <p className="text-[1.0625rem] text-ink-2">{subtitle}</p>}
                {p.reviewed && (
                  <p className="text-[0.875rem] text-ink-3 flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 text-bronze shrink-0" aria-hidden="true" />
                    <span>
                      Reviewed: our team approved this profile before it was published.{" "}
                      <a href="/faq/" className="link font-normal">What this means</a>
                    </span>
                  </p>
                )}
              </header>

              {p.bio && (
                <section aria-labelledby="profile-about" className="space-y-2">
                  <h3 id="profile-about" className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-ink-3">About</h3>
                  <p className="text-[1.0625rem] leading-relaxed text-ink-2 whitespace-pre-line">{p.bio}</p>
                </section>
              )}

              {p.quote && (
                <figure className="border-l-2 border-bronze pl-5">
                  <blockquote className="font-display text-[1.25rem] leading-snug text-ink">“{p.quote}”</blockquote>
                </figure>
              )}

              {(hasAudience || p.facts.length > 0) && (
                <section aria-labelledby="profile-facts" className="space-y-3">
                  <h3 id="profile-facts" className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-ink-3">At a glance</h3>
                  <dl className="divide-y divide-line border-y border-line">
                    {p.reach && (
                      <div className="flex justify-between gap-6 py-3">
                        <dt className="text-ink-2">Followers</dt>
                        <dd className="font-semibold text-ink text-right">{p.reach}</dd>
                      </div>
                    )}
                    {p.engagement && (
                      <div className="flex justify-between gap-6 py-3">
                        <dt className="text-ink-2">Engagement rate</dt>
                        <dd className="font-semibold text-ink text-right">{p.engagement}</dd>
                      </div>
                    )}
                    {p.facts.map((f) => (
                      <div key={f.label} className="flex justify-between gap-6 py-3">
                        <dt className="text-ink-2">{f.label}</dt>
                        <dd className="font-semibold text-ink text-right">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                  {hasAudience && (
                    <p className="text-[0.8125rem] text-ink-3">Audience figures are supplied by the creator and are not independently audited.</p>
                  )}
                </section>
              )}

              {photos.length > 0 && (
                <section aria-labelledby="profile-work" className="space-y-3">
                  <h3 id="profile-work" className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-ink-3">Work</h3>
                  <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {photos.map((src, i) => (
                      <li key={src}>
                        <button
                          type="button"
                          onClick={() => setPhotoIndex(i)}
                          aria-label={`Open photo ${i + 1} of ${photos.length}`}
                          className="block w-full cursor-zoom-in"
                        >
                          <Photo src={src} name={p.name} ratio="aspect-square" className="rounded-[2px]" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <div className="border-t border-line pt-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button type="button" onClick={onOpenCollaboration} className="btn btn-primary" id="initiate-charter-btn">
                    Enquire about working with {firstName(p.name)}
                  </button>
                </div>
                <p className="text-[0.8125rem] text-ink-3">
                  Enquiries go to our team, who contact the creator. Is something on this profile wrong?{" "}
                  <button type="button" onClick={onReport} className="link font-normal cursor-pointer">Ask for a correction</button>
                </p>
              </div>
            </div>
          </div>
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
