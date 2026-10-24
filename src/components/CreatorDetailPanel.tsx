import React, { useState } from "react";
import { motion } from "motion/react";
import { X, ShieldCheck, MapPin, Award, Heart, ChevronRight, BadgeCheck, Trophy } from "lucide-react";
import { influencerId } from "../content/awards";
import { Creator } from "../data";
import toast from "react-hot-toast";
import { useDialog, Portal } from "../lib/dialog";

interface CreatorDetailPanelProps {
  key?: string;
  creator: Creator | null;
  onClose: () => void;
  onOpenCollaboration: () => void;
  moodboardItems?: string[];
  /** Award titles this creator holds (gallery sections they appear in) */
  awards?: string[];
}

const SectionLabel: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <h3 id={id} className="flex items-center gap-3 text-[12px] font-bold tracking-[0.22em] uppercase text-[#F3DCA6]">
    {children}
    <span aria-hidden="true" className="flex-1 h-px bg-gradient-to-r from-[#E1C699]/50 to-transparent" />
  </h3>
);

export default function CreatorDetailPanel({
  creator,
  onClose,
  onOpenCollaboration,
  moodboardItems = [],
  awards = [],
}: CreatorDetailPanelProps) {
  const [lightboxImg, setLightboxImg] = React.useState<string | null>(null);
  const panelRef = useDialog<HTMLDivElement>(!!creator, onClose);
  const lightboxRef = useDialog<HTMLDivElement>(!!lightboxImg, () => setLightboxImg(null));

  const [heroFailed, setHeroFailed] = useState(false);

  if (!creator) return null;

  // Filter out core standard stats for custom metric rendering
  const standardStatKeys = ["reach", "engagement", "verified"];
  const customStats = Object.entries(creator.stats).filter(
    ([key]) => !standardStatKeys.includes(key)
  );

  const verified = creator.stats?.verified !== false;
  const statLabel = (key: string) => key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ");

  return (
    <Portal>
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="creator-detail-name"
      tabIndex={-1}
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 32, stiffness: 200 }}
      className="surface-dark fixed top-0 right-0 w-full md:w-[500px] h-full bg-[#0a0f1c] text-white md:border-l md:border-[#E1C699]/40 shadow-[0_0_60px_rgba(0,0,0,0.35)] flex flex-col z-[55] select-none overflow-hidden outline-none"
      id="creator-detail-panel-container"
    >
      {/* Content Scroller */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Cover portrait */}
        <div className="relative h-[46vh] min-h-[300px] max-h-[440px] overflow-hidden">
          {creator.image && !heroFailed ? (
            <img
              src={creator.image}
              alt=""
              onError={() => setHeroFailed(true)}
              className="absolute inset-0 w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-[#1f2a44] via-[#141b2e] to-[#0a0f1c]" />
          )}
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0a0f1c] via-[#0a0f1c]/30 to-black/40" />

          {/* Top bar */}
          <div className="absolute top-0 inset-x-0 flex items-center justify-between p-4 md:p-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur-sm border border-[#E1C699]/40 px-3 py-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#F3DCA6]" aria-hidden="true" />
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#F3DCA6]">{verified ? "FSIA Verified" : "Star India"}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(new Event("open-moodboard"));
                }}
                className="w-11 h-11 rounded-full bg-black/55 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/75 transition-colors cursor-pointer relative"
                title="View Moodboard"
                aria-label={`Open moodboard (${moodboardItems.length} saved)`}
              >
                <Heart className="w-4 h-4 text-[#ff8f8f]" aria-hidden="true" />
                {moodboardItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#E1C699] text-[#111] text-[11px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {moodboardItems.length}
                  </span>
                )}
              </button>
              <button
                onClick={onClose}
                aria-label="Close creator profile"
                className="w-11 h-11 rounded-full bg-black/55 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/75 transition-colors cursor-pointer"
                id="close-creator-details-btn"
              >
                <X className="w-5 h-5 text-white" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Name block */}
          <div className="absolute inset-x-0 bottom-0 p-5 md:p-7 space-y-2">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.15em] uppercase text-[#F3DCA6]">
              <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
              {creator.city ? `${creator.city}, India` : "India"}
            </span>
            <h2 id="creator-detail-name" className="font-serif-display text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.05] flex items-center gap-2 drop-shadow">
              {creator.name}
              {verified && <BadgeCheck className="w-7 h-7 shrink-0 text-[#F3DCA6]" aria-label="Verified" />}
            </h2>
            <p className="font-serif-text italic text-base md:text-lg text-[#e9e6df]">{creator.role}</p>
          </div>
        </div>

        <div className="px-5 md:px-7 pb-8 space-y-8">
          {/* Influencer ID strip */}
          <div className="relative -mt-1 rounded-2xl p-[1.5px] bg-gradient-to-r from-[#f3dca6] via-[#9c7a3c] to-[#f3dca6]">
            <div className="rounded-[14.5px] bg-gradient-to-br from-[#161e33] to-[#0d1324] px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span aria-hidden="true" className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-b from-[#f3dca6] to-[#b8893b] flex items-center justify-center shadow">
                  <Trophy className="w-4.5 h-4.5 text-[#3b2a0c]" />
                </span>
                <div className="min-w-0">
                  <span className="block text-[11px] font-bold tracking-[0.2em] uppercase text-[#c9c4b8]">Influencer ID</span>
                  <span className="block font-mono text-base font-semibold text-[#F3DCA6]">{influencerId(creator.name)}</span>
                </div>
              </div>
              <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#c9c4b8] text-right">Star India<br />member</span>
            </div>
          </div>

          {/* Awards */}
          {awards.length > 0 && (
            <section aria-labelledby="creator-awards" className="space-y-3">
              <SectionLabel id="creator-awards">Awards won</SectionLabel>
              <ul className="flex flex-wrap gap-2">
                {awards.map((a) => (
                  <li key={a} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#f3dca6] to-[#d4b06a] text-[#2b1f08] text-[13px] font-bold px-3 py-1.5">
                    <Award className="w-3.5 h-3.5" aria-hidden="true" />
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Key metrics */}
          <section aria-labelledby="creator-metrics" className="space-y-3">
            <SectionLabel id="creator-metrics">Audience</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Followers", value: creator.stats.reach, note: "Combined reach" },
                { label: "Engagement", value: creator.stats.engagement, note: "Interaction rate" }
              ].map((m) => (
                <div key={m.label} className="relative overflow-hidden rounded-2xl border border-[#E1C699]/25 bg-white/[0.04] p-4">
                  <span aria-hidden="true" className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-[radial-gradient(circle,rgba(243,220,166,0.18),transparent_70%)]" />
                  <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-[#c9c4b8]">{m.label}</span>
                  <span className="block font-serif-display text-3xl font-bold text-white mt-1">{String(m.value || "—")}</span>
                  <span className="block text-[12px] text-[#F3DCA6] mt-0.5">{m.note}</span>
                </div>
              ))}
            </div>
            {customStats.length > 0 && (
              <dl className="rounded-2xl border border-white/10 bg-white/[0.03] divide-y divide-white/10">
                {customStats.map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center gap-4 px-4 py-3">
                    <dt className="text-[12px] font-semibold uppercase tracking-wider text-[#c9c4b8] capitalize">{statLabel(key)}</dt>
                    <dd className="font-serif-text font-bold text-white text-right">{String(val)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          {/* Quote */}
          {creator.quote && (
            <figure className="relative rounded-2xl bg-gradient-to-br from-[#1b2440] to-[#10172a] border border-white/10 p-5 pl-12">
              <span aria-hidden="true" className="absolute top-1 left-4 font-serif-display text-6xl leading-none text-[#E1C699]/70">&ldquo;</span>
              <blockquote className="font-serif-text italic text-[17px] leading-relaxed text-[#f1ede4]">{creator.quote}</blockquote>
            </figure>
          )}

          {/* Biography */}
          <section aria-labelledby="creator-bio" className="space-y-3">
            <SectionLabel id="creator-bio">Biography</SectionLabel>
            <p className="text-[15px] text-[#e9e6df] leading-relaxed">{creator.bio}</p>
          </section>

          {/* Lookbook */}
          {creator.portfolio?.length > 0 && (
            <section aria-labelledby="creator-lookbook" className="space-y-3">
              <SectionLabel id="creator-lookbook">Lookbook</SectionLabel>
              <div className="grid grid-cols-3 gap-2">
                {creator.portfolio.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setLightboxImg(imgUrl)}
                    aria-label={`Enlarge lookbook photo ${idx + 1} of ${creator.portfolio.length}`}
                    className={`relative overflow-hidden rounded-xl bg-[#141b2e] border border-[#E1C699]/25 group cursor-pointer text-left ${idx === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"}`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${creator.name} — lookbook photo ${idx + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                      <span className="text-[11px] tracking-widest uppercase text-white font-bold bg-black/60 px-2 py-1 rounded">View</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Booking Drawer Action Trigger */}
      <div className="p-4 md:p-5 border-t border-[#E1C699]/25 bg-[#0d1324]">
        <button
          onClick={onOpenCollaboration}
          className="w-full bg-gradient-to-r from-[#f3dca6] via-[#E1C699] to-[#c9a35c] hover:brightness-105 text-[#111] text-[13px] sm:text-sm tracking-[0.1em] font-bold py-4 px-5 rounded-xl uppercase whitespace-nowrap flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_10px_30px_-10px_rgba(225,198,153,0.6)] active:scale-[0.98]"
          id="initiate-charter-btn"
        >
          Hire {creator.name.replace(/^(Dr\.?|Mr\.?|Ms\.?|Mrs\.?)\s+/i, "").split(" ")[0]} for a campaign
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Fullscreen Lightbox Portal Overlay */}
      {lightboxImg && (
        <Portal>
        <div 
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${creator.name} — lookbook photo`}
          tabIndex={-1}
          onClick={() => setLightboxImg(null)}
          className="surface-dark fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 cursor-zoom-out pointer-events-auto outline-none"
        >
          <div className="absolute top-6 right-6 flex items-center gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new Event("open-moodboard"));
                setLightboxImg(null);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
            >
              <Heart className="w-4 h-4" aria-hidden="true" />
              <span className="text-[11px] font-sans font-bold tracking-widest uppercase">Moodboard ({moodboardItems.length})</span>
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setLightboxImg(null);
              }}
              aria-label="Close photo"
              className="text-white hover:text-champagne transition-colors p-2 bg-white/10 rounded-full cursor-pointer"
            >
              <X className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>
          
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img 
              src={lightboxImg} 
              alt={`${creator.name} — lookbook photo, enlarged`}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-white/5"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                const isAdding = !moodboardItems.includes(lightboxImg);
                window.dispatchEvent(new CustomEvent("toggle-moodboard", { detail: lightboxImg }));
                
                if (isAdding) {
                  toast.success("Added to Moodboard", {
                    style: {
                      background: "#111",
                      color: "#E1C699",
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      fontWeight: "bold"
                    },
                    iconTheme: {
                      primary: "#E1C699",
                      secondary: "#111",
                    }
                  });
                }
              }}
              aria-label={moodboardItems.includes(lightboxImg) ? "Remove from moodboard" : "Save to moodboard"}
              aria-pressed={moodboardItems.includes(lightboxImg)}
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-2xl flex items-center justify-center cursor-pointer hover:scale-105 transition-transform active:scale-95 group"
            >
              <Heart 
                className={`w-8 h-8 transition-all duration-300 ${moodboardItems.includes(lightboxImg) ? 'text-red-500 fill-red-500 scale-110' : 'text-[#888] scale-100 group-hover:scale-110'}`} 
              />
            </button>
          </div>

          <p className="mt-12 text-xs font-serif-text italic text-[#E1C699] tracking-widest uppercase">
            Forever Influencer Creator Profile • Click anywhere or press Esc to close
          </p>
        </div>
        </Portal>
      )}
    </motion.div>
    </Portal>
  );
}
