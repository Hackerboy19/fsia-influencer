import React, { useState } from "react";
import { ArrowUpRight, BadgeCheck, MapPin, Trophy, UserRound } from "lucide-react";
import type { Creator } from "../data";
import { influencerId } from "../content/awards";

interface ProfileCardProps {
  creator: Creator;
  /** Award or category shown on the gold ribbon */
  award?: string;
  /** Short line under the name (defaults to the creator's role) */
  tagline?: string;
  onOpen: () => void;
  ariaLabel?: string;
  /** Smaller type for 2-column phone grids */
  compact?: boolean;
}

// Premium Influencer ID card used on Star India, Talent and the home page:
// gold foil frame, dark card, portrait with a light sweep on hover, member number and stats.
const ProfileCard: React.FC<ProfileCardProps> = ({ creator, award, tagline, onOpen, ariaLabel, compact = false }) => {
  const [failed, setFailed] = useState(false);
  const verified = creator.stats?.verified !== false;
  const reach = creator.stats?.reach ? String(creator.stats.reach) : "—";
  const engagement = creator.stats?.engagement ? String(creator.stats.engagement) : "—";

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={ariaLabel ?? `View ${creator.name}`}
      className="fsia-profile-card group relative block w-full h-full text-left rounded-[20px] p-[1.5px] bg-gradient-to-br from-[#f3dca6] via-[#9c7a3c] to-[#f3dca6] shadow-[0_10px_30px_-12px_rgba(17,17,17,0.45)] hover:shadow-[0_24px_50px_-16px_rgba(184,137,59,0.55)] hover:-translate-y-1.5 motion-reduce:hover:translate-y-0 transition-all duration-500 cursor-pointer"
    >
      <span className="surface-dark relative flex flex-col h-full rounded-[18.5px] overflow-hidden bg-gradient-to-b from-[#141b2e] to-[#0a0f1c] text-white">
        {/* Portrait */}
        <span className="relative block aspect-[4/5] overflow-hidden">
          {creator.image && !failed ? (
            <img
              src={creator.image}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setFailed(true)}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110 motion-reduce:group-hover:scale-100"
            />
          ) : (
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1f2a44] to-[#0a0f1c]">
              <UserRound className="w-1/3 h-1/3 text-[#E1C699]/60" />
            </span>
          )}
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0a0f1c] via-[#0a0f1c]/25 to-black/35" />
          {/* Light sweep on hover */}
          <span
            aria-hidden="true"
            className="absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-[400%] transition-transform duration-[1400ms] ease-out motion-reduce:hidden"
          />

          {/* Crest */}
          <span className={`absolute top-2.5 left-2.5 items-center gap-1.5 rounded-full bg-black/55 backdrop-blur-sm border border-[#E1C699]/40 ${compact ? "hidden lg:inline-flex px-2 py-0.5" : "inline-flex px-2.5 py-1"}`}>
            <span aria-hidden="true" className="text-[#E1C699] text-[10px] fsia-twinkle">✦</span>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#F3DCA6]">Star India</span>
          </span>

          {/* Gold award medal */}
          <span
            aria-hidden="true"
            className={`absolute top-2.5 right-2.5 rounded-full bg-gradient-to-b from-[#f3dca6] to-[#b8893b] border border-white/70 shadow-lg flex items-center justify-center ${compact ? "w-8 h-8" : "w-10 h-10"}`}
          >
            <Trophy className={`${compact ? "w-3.5 h-3.5" : "w-4.5 h-4.5"} text-[#3b2a0c]`} />
          </span>

          {/* Name on the photo */}
          <span className={`absolute inset-x-0 bottom-0 ${compact ? "p-3" : "p-4"}`}>
            <span className={`flex items-center gap-1.5 font-serif-display font-bold leading-tight text-white drop-shadow ${compact ? "text-[15px] sm:text-lg" : "text-xl"}`}>
              <span className="truncate">{creator.name}</span>
              {verified && <BadgeCheck className={`${compact ? "w-4 h-4" : "w-5 h-5"} shrink-0 text-[#F3DCA6]`} aria-label="Verified" />}
            </span>
            <span className={`block text-[#e9e6df] truncate ${compact ? "text-[11px] sm:text-[12px]" : "text-[13px]"}`}>{tagline ?? creator.role}</span>
            {!compact && creator.city && (
              <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-[#F3DCA6]">
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> {creator.city}
              </span>
            )}
          </span>
        </span>

        {/* ID and stats */}
        <span className={`flex flex-col flex-1 ${compact ? "px-3 pb-3 pt-2 gap-2" : "px-4 pb-4 pt-3 gap-3"}`}>
          <span className="flex items-center justify-between gap-2 border-b border-dashed border-[#E1C699]/30 pb-2">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#c9c4b8] whitespace-nowrap">{compact ? "ID" : "Influencer ID"}</span>
            <span className="font-mono text-[11px] sm:text-[12px] font-semibold text-[#F3DCA6] whitespace-nowrap">{influencerId(creator.name)}</span>
          </span>
          <span className="grid grid-cols-2 gap-2 text-center">
            <span className="rounded-lg bg-white/[0.06] py-1.5 min-w-0">
              <span className={`block font-bold text-white ${compact ? "text-sm" : "text-base"}`}>{reach}</span>
              <span className="block text-[10px] uppercase tracking-wide text-[#c9c4b8] truncate">{compact ? "Reach" : "Followers"}</span>
            </span>
            <span className="rounded-lg bg-white/[0.06] py-1.5 min-w-0">
              <span className={`block font-bold text-white ${compact ? "text-sm" : "text-base"}`}>{engagement}</span>
              <span className="block text-[10px] uppercase tracking-wide text-[#c9c4b8] truncate">{compact ? "Engage" : "Engagement"}</span>
            </span>
          </span>
          <span className="mt-auto flex items-center justify-between gap-2">
            {award ? (
              <span className={`inline-flex min-w-0 items-center gap-1 rounded-full bg-gradient-to-r from-[#f3dca6] to-[#d4b06a] text-[#2b1f08] font-bold ${compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"}`}>
                <span aria-hidden="true">❦</span>
                <span className="truncate">{award}</span>
              </span>
            ) : (
              <span />
            )}
            <span
              aria-hidden="true"
              className={`shrink-0 rounded-full border border-[#E1C699]/50 flex items-center justify-center text-[#F3DCA6] group-hover:bg-[#E1C699] group-hover:text-[#111] transition-colors ${compact ? "w-7 h-7" : "w-8 h-8"}`}
            >
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </span>
        </span>
      </span>
    </button>
  );
};

export default ProfileCard;
