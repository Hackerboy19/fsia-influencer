import React from "react";
import { motion } from "motion/react";
import { X, ShieldCheck, MapPin, Award, Heart, Briefcase, ChevronRight } from "lucide-react";
import { Creator } from "../data";

interface CreatorDetailPanelProps {
  key?: string;
  creator: Creator | null;
  onClose: () => void;
  onOpenCollaboration: () => void;
}

export default function CreatorDetailPanel({
  creator,
  onClose,
  onOpenCollaboration,
}: CreatorDetailPanelProps) {
  if (!creator) return null;

  // Filter out core standard stats for custom metric rendering
  const standardStatKeys = ["reach", "engagement", "verified"];
  const customStats = Object.entries(creator.stats).filter(
    ([key]) => !standardStatKeys.includes(key)
  );

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 32, stiffness: 200 }}
      className="absolute top-0 right-0 w-full md:w-[480px] h-full bg-white/90 backdrop-blur-2xl border-l border-black/5 shadow-[0_0_50px_rgba(0,0,0,0.03)] flex flex-col z-40 select-none overflow-hidden"
      id="creator-detail-panel-container"
    >
      {/* Editorial Floating Bar */}
      <div className="flex items-center justify-between p-6 bg-[#F4F3F0]/60 border-b border-black/5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E1C699] animate-pulse" />
          <span className="font-sans text-[10px] tracking-[0.3em] text-[#8E8D8A] uppercase font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#E1C699] inline" />
            Verified VIP Installation
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors cursor-pointer"
          id="close-creator-details-btn"
        >
          <X className="w-5 h-5 text-[#333]" />
        </button>
      </div>

      {/* Content Scroller */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
        {/* Name and Origin */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-sans text-[#888] tracking-widest uppercase">
            <MapPin className="w-3.5 h-3.5 text-champagne" />
            {creator.city}, India
          </div>
          <h2 className="font-serif-display text-4xl font-bold tracking-tight text-[#111] leading-none">
            {creator.name}
          </h2>
          <p className="font-serif-text italic text-lg text-champagne">
            {creator.role}
          </p>
        </div>

        {/* Large Vogue-Style Quotation Block */}
        <div className="relative pl-6 py-1 border-l-2 border-champagne/40">
          <span className="absolute -top-3 -left-2 text-6xl text-champagne/25 font-serif-display select-none">
            “
          </span>
          <p className="font-serif-text italic text-base leading-relaxed text-[#444]">
            {creator.quote}
          </p>
        </div>

        {/* Biography Block */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
            Curated Biography
          </h4>
          <p className="font-sans text-xs font-light text-[#555] leading-relaxed">
            {creator.bio}
          </p>
        </div>

        {/* VIP Engagement Metrics */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
            Verified Audited Metrics
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {/* Reach */}
            <div className="p-4 bg-white/50 border border-black/5 rounded-xl text-center space-y-1">
              <span className="block text-[9px] font-sans text-[#888] uppercase tracking-wider">
                Digital Footprint
              </span>
              <span className="block font-serif-display text-2xl font-bold text-[#111]">
                {creator.stats.reach}
              </span>
              <span className="block text-[9px] font-sans text-champagne uppercase font-medium tracking-widest">
                Combined Reach
              </span>
            </div>

            {/* Engagement */}
            <div className="p-4 bg-white/50 border border-black/5 rounded-xl text-center space-y-1">
              <span className="block text-[9px] font-sans text-[#888] uppercase tracking-wider">
                Audience Core
              </span>
              <span className="block font-serif-display text-2xl font-bold text-[#111]">
                {creator.stats.engagement}
              </span>
              <span className="block text-[9px] font-sans text-champagne uppercase font-medium tracking-widest">
                Interaction Ratio
              </span>
            </div>
          </div>

          {/* Custom Section Specific Stats */}
          {customStats.length > 0 && (
            <div className="mt-3 p-4 bg-[#F4F3F0]/40 border border-black/5 rounded-xl space-y-2">
              {customStats.map(([key, val]) => (
                <div key={key} className="flex justify-between items-center text-xs">
                  <span className="text-[#888] font-sans uppercase tracking-wider text-[10px]">
                    {key}
                  </span>
                  <span className="font-serif-text font-bold text-[#222]">
                    {String(val)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editorial Lookbook Mini Slider */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] text-[#666] uppercase">
            Couture Lookbook
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {creator.portfolio.map((imgUrl, idx) => (
              <div
                key={idx}
                className="relative aspect-square overflow-hidden rounded-lg bg-[#EEE] border border-black/5 group"
              >
                <img
                  src={imgUrl}
                  alt={`Lookbook ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Drawer Action Trigger */}
      <div className="p-6 border-t border-black/5 bg-[#FAF9F6]">
        <button
          onClick={onOpenCollaboration}
          className="w-full bg-[#111] hover:bg-[#222] text-white font-sans text-xs tracking-[0.25em] font-medium py-4 px-6 rounded-lg uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-[0.98]"
          id="initiate-charter-btn"
        >
          INITIATE VIP CHARTER
          <ChevronRight className="w-4 h-4 text-champagne" />
        </button>
      </div>
    </motion.div>
  );
}
