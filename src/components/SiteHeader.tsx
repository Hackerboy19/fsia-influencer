import React from "react";
import { Volume2, VolumeX, ExternalLink, FileText, Facebook, Instagram, Youtube } from "lucide-react";
import { TabId, routeForTab } from "../seo";

/**
 * Site header in the style of the live Star India site (starindia.fsia.in):
 * blue announcement bar, white bar, red faceted star logo, rounded menu pills,
 * round social icons and a red rounded button.
 *
 * Heights are fixed so the page content can sit right under it:
 *   below xl: 32px bar + 56px logo row + 48px menu row = 136px
 *   xl and up: 32px bar + 80px single row            = 112px
 */

export const StarLogo: React.FC<{ className?: string }> = ({ className = "w-9 h-9" }) => (
  <svg viewBox="0 0 100 100" className={`${className} shrink-0`} fill="none" aria-hidden="true">
    <polygon points="50,6 50,50 25,65" fill="#e53935" />
    <polygon points="50,6 50,50 75,65" fill="#b71c1c" />
    <polygon points="97,38 50,50 50,6" fill="#d32f2f" />
    <polygon points="97,38 50,50 79,94" fill="#9a0007" />
    <polygon points="79,94 50,50 50,75" fill="#c62828" />
    <polygon points="79,94 50,50 75,65" fill="#e53935" />
    <polygon points="21,94 50,50 25,65" fill="#d32f2f" />
    <polygon points="21,94 50,50 50,75" fill="#b71c1c" />
    <polygon points="3,38 50,50 50,6" fill="#ef5350" />
    <polygon points="3,38 50,50 21,94" fill="#c62828" />
    <circle cx="50" cy="50" r="3.5" fill="#ffffff" opacity="0.5" />
  </svg>
);

const SOCIALS = [
  { label: "Facebook", href: "https://www.facebook.com/Foreverstarindiaawards/", Icon: Facebook },
  { label: "YouTube", href: "https://www.youtube.com/c/foreverstarindiaaward", Icon: Youtube },
  { label: "Instagram", href: "https://www.instagram.com/fsia_forever/", Icon: Instagram }
];

interface SiteHeaderProps {
  tabs: { id: TabId; label: string }[];
  activeTab: TabId;
  onTab: (tab: TabId) => void;
  onHome: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onBrandEnquiry: () => void;
}

export default function SiteHeader({ tabs, activeTab, onTab, onHome, audioEnabled, onToggleAudio, onBrandEnquiry }: SiteHeaderProps) {
  const go = (e: React.MouseEvent, fn: () => void) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    fn();
  };

  const iconBtn =
    "w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:text-[#d32f2f] hover:border-[#d32f2f] transition-colors cursor-pointer shrink-0";

  return (
    <header className="absolute top-0 inset-x-0 z-20 bg-white border-b border-gray-100 shadow-xs font-sans">
      {/* Blue announcement bar, same as starindia.fsia.in */}
      <a
        href={routeForTab("apply").path}
        onClick={(e) => go(e, () => onTab("apply"))}
        className="flex h-8 items-center justify-center gap-2 bg-[#1034a6] px-4 text-white text-[11px] sm:text-[13px] font-medium tracking-wide hover:bg-[#0d2c8f] transition-colors"
      >
        <span className="text-amber-300 font-bold select-none hidden sm:inline" aria-hidden="true">✨ ✦</span>
        <span className="truncate">Now Shine on a National Platform - Register Today and Create Your Authentic Professional Profile!</span>
        <span className="text-amber-300 font-bold select-none hidden sm:inline" aria-hidden="true">✦ ✨</span>
      </a>

      <div className="max-w-[1500px] mx-auto px-3 sm:px-6 xl:h-20 flex flex-col xl:flex-row xl:items-center xl:justify-between xl:gap-4">
        {/* Logo row (also holds the buttons below xl) */}
        <div className="h-14 xl:h-auto flex items-center justify-between gap-3 xl:shrink-0">
          <a
            href="/"
            onClick={(e) => go(e, onHome)}
            aria-label="FSIA Influencer, home"
            className="flex items-center gap-2 sm:gap-2.5 shrink-0"
          >
            <StarLogo className="w-8 h-8 sm:w-9 sm:h-9" />
            <span className="flex flex-col leading-none">
              <span className="text-lg sm:text-[22px] font-black tracking-tight text-gray-950 uppercase whitespace-nowrap">
                FSIA Influencer
              </span>
              <span className="text-[8px] sm:text-[9.5px] font-bold tracking-[0.2em] text-[#d32f2f] uppercase mt-1 whitespace-nowrap">
                Influencer Award Agency
              </span>
            </span>
          </a>

          <div className="flex items-center gap-1.5 sm:gap-2 xl:hidden">
            <button
              onClick={onToggleAudio}
              className={iconBtn}
              id="toggle-synth-audio-btn-mobile"
              title="Ambient sound"
              aria-label={audioEnabled ? "Mute ambient sound" : "Play ambient sound"}
              aria-pressed={audioEnabled}
            >
              {audioEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#d32f2f]" aria-hidden="true" /> : <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />}
            </button>
            <a href="https://www.fsia.in" target="_blank" rel="noopener noreferrer" className={iconBtn} title="FSIA Portal" aria-label="FSIA Portal (opens in a new tab)">
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
            <button
              onClick={onBrandEnquiry}
              id="open-collaboration-form-btn-mobile"
              aria-label="Brand enquiry"
              className="h-8 bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-bold text-[11px] uppercase tracking-wider px-3 sm:px-4 rounded-full shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden min-[480px]:inline">Brand enquiry</span>
            </button>
          </div>
        </div>

        {/* Menu: pills like the live site; scrolls sideways when it does not fit */}
        <nav
          aria-label="Main"
          id="main-nav-tabs"
          className="h-12 xl:h-auto flex items-center gap-1 overflow-x-auto scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0 border-t border-gray-100 xl:border-0 xl:min-w-0 text-[13px] font-medium text-gray-700"
        >
          {tabs.map(({ id, label }) => {
            const on = activeTab === id;
            return (
              <a
                key={id}
                href={routeForTab(id).path}
                aria-current={on ? "page" : undefined}
                onClick={(e) => go(e, () => onTab(id))}
                className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 transition-colors cursor-pointer ${
                  on ? "bg-[#faeedb] text-[#2d2319] font-semibold" : "hover:text-[#d32f2f]"
                }`}
              >
                {label}
              </a>
            );
          })}
        </nav>

        {/* Buttons on wide screens */}
        <div className="hidden xl:flex items-center gap-2 shrink-0">
          <div className="hidden 2xl:flex items-center gap-2 mr-1">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`Star India on ${label}`} className={iconBtn}>
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            ))}
          </div>
          <button
            onClick={onToggleAudio}
            id="toggle-synth-audio-btn"
            title={audioEnabled ? "Ambient sound on, click to mute" : "Ambient sound off, click to play"}
            aria-label={audioEnabled ? "Mute ambient sound" : "Play ambient sound"}
            aria-pressed={audioEnabled}
            className={iconBtn}
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#d32f2f]" aria-hidden="true" /> : <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />}
          </button>
          <a
            href="https://www.fsia.in"
            target="_blank"
            rel="noopener noreferrer"
            title="FSIA Portal (fsia.in)"
            className="h-9 px-4 rounded-full border border-gray-300 text-gray-800 hover:border-[#d32f2f] hover:text-[#d32f2f] text-xs font-bold uppercase tracking-wider flex items-center whitespace-nowrap transition-colors"
          >
            FSIA Portal<span className="sr-only"> (opens in a new tab)</span>
          </a>
          <button
            onClick={onBrandEnquiry}
            id="open-collaboration-form-btn"
            className="h-9 bg-[#d32f2f] hover:bg-[#b71c1c] active:bg-[#9a0007] text-white font-bold text-xs uppercase tracking-wider px-5 rounded-full shadow-sm hover:shadow flex items-center gap-2 whitespace-nowrap cursor-pointer active:scale-95 transition-all"
          >
            <FileText className="w-4 h-4" aria-hidden="true" />
            Brand Enquiry
          </button>
        </div>
      </div>
    </header>
  );
}
