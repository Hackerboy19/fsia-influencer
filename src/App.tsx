import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Volume2,
  VolumeX,
  Compass,
  FileText,
  ShieldAlert,
  ArrowDownCircle,
  TrendingUp,
  Award,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { gallerySections, Creator } from "./data";
import ThreeGallery from "./components/ThreeGallery";
import CreatorDetailPanel from "./components/CreatorDetailPanel";
import VipCollaborationForm from "./components/VipCollaborationForm";
import DirectoryTab from "./components/DirectoryTab";
import CampaignsTab from "./components/CampaignsTab";
import MembershipTab from "./components/MembershipTab";
import FaqTab from "./components/FaqTab";

export default function App() {
  // Navigation & Showcase States
  const [hasEntered, setHasEntered] = useState(false);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isCollaborationOpen, setIsCollaborationOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"catwalk" | "directory" | "campaigns" | "membership" | "faq">("catwalk");

  // Audio Control (Procedural Runway Lounge Synth)
  const [audioEnabled, setAudioEnabled] = useState(false);
  const synthRef = useRef<any>(null);

  // Initialize and trigger ambient audio drone safely
  const startAmbientSynth = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      // Soft lowpass filter to retain only deep, warm frequencies
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(260, ctx.currentTime);
      filter.Q.setValueAtTime(1.2, ctx.currentTime);

      // Master volume node
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 3.0); // smooth swell

      filter.connect(masterGain);
      masterGain.connect(ctx.destination);

      // Create a majestic major-7th chord (Ab major 7th for a high-fashion warm vibe)
      // Ab2 (103.83Hz), C3 (130.81Hz), Eb3 (155.56Hz), G3 (196.00Hz)
      const pitches = [103.83, 130.81, 155.56, 196.00];
      const oscillators = pitches.map((pitch, idx) => {
        const osc = ctx.createOscillator();
        osc.type = "triangle"; // soft, vintage woodwind-like
        osc.frequency.setValueAtTime(pitch, ctx.currentTime);

        const oscGain = ctx.createGain();
        const baseVol = idx === 0 ? 0.35 : idx === 1 ? 0.25 : idx === 2 ? 0.2 : 0.15;
        oscGain.gain.setValueAtTime(baseVol, ctx.currentTime);

        // Slow pitch drift LFOs to simulate lush analog detuning
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.08 + idx * 0.04, ctx.currentTime);
        lfoGain.gain.setValueAtTime(1.5, ctx.currentTime); // tiny detune

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        lfo.start();
        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start();

        return { osc, oscGain, lfo };
      });

      synthRef.current = { ctx, masterGain, oscillators };
      setAudioEnabled(true);
    } catch (e) {
      console.warn("WebGL Audio initialization failed or blocked by sandbox:", e);
    }
  };

  const stopAmbientSynth = () => {
    if (synthRef.current) {
      try {
        const { ctx, masterGain } = synthRef.current;
        masterGain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.8);
        setTimeout(() => {
          ctx.close();
        }, 900);
      } catch (e) {
        console.warn("Failed to tear down synth:", e);
      }
      synthRef.current = null;
    }
    setAudioEnabled(false);
  };

  const toggleAudio = () => {
    if (audioEnabled) {
      stopAmbientSynth();
    } else {
      startAmbientSynth();
    }
  };

  // Auto clean audio on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        try {
          synthRef.current.ctx.close();
        } catch (e) {}
      }
    };
  }, []);

  const handleEnterExperience = () => {
    setHasEntered(true);
    // Automatically trigger ambient audio to immerse the visitor
    startAmbientSynth();
  };

  const activeSection = gallerySections[activeSectionIndex];

  // Glide through runway sections
  const handlePrevSection = () => {
    if (activeSectionIndex > 0) {
      setActiveSectionIndex(activeSectionIndex - 1);
    }
  };

  const handleNextSection = () => {
    if (activeSectionIndex < gallerySections.length - 1) {
      setActiveSectionIndex(activeSectionIndex + 1);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-alabaster font-sans text-[#111] select-none">
      <AnimatePresence mode="wait">
        {!hasEntered ? (
          /* SECTION 1: THE ULTRA-PRESTIGE INVITATION GALA GATE */
          <motion.div
            key="welcome-gate"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
            className="absolute inset-0 z-50 flex flex-col justify-between p-8 md:p-16 bg-[#FAF9F6] overflow-hidden"
            id="gala-welcome-gate"
          >
            {/* Decorative fine-art background grids */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#E1C699_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] border border-[#E1C699]/15 rounded-full pointer-events-none" />

            {/* Top Branding Header */}
            <div className="flex justify-between items-center z-10">
              <span className="font-sans text-xs tracking-[0.35em] text-[#8E8D8A] uppercase font-bold">
                FOREVER STAR INDIA
              </span>
              <span className="px-3.5 py-1 rounded-full border border-champagne/30 text-[9px] font-sans text-champagne uppercase font-bold tracking-[0.2em]">
                VIP Tier Access
              </span>
            </div>

            {/* Central Invitation Box */}
            <div className="max-w-3xl mx-auto text-center space-y-10 z-10 px-4">
              <div className="space-y-4">
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 text-xs font-sans tracking-[0.4em] text-champagne font-bold uppercase"
                >
                  <Sparkles className="w-4.5 h-4.5 animate-pulse text-champagne" />
                  Bespoke Editorial Exposition
                </motion.span>
                <motion.h1
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="font-serif-display text-4xl md:text-6xl lg:text-7xl font-light tracking-tight text-[#111] leading-[1.05]"
                >
                  FSIA VIP GALLERY
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="font-serif-text italic text-base md:text-xl text-[#666] max-w-2xl mx-auto leading-relaxed"
                >
                  Immerse in a sun-drenched architectural pavilion of verified pageant victors, social champions, and elite digital authorities.
                </motion.p>
              </div>

              {/* Invitation Acceptance Seal */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="inline-block p-8 border border-champagne/20 bg-white/40 backdrop-blur-md rounded-2xl max-w-md shadow-sm relative overflow-hidden"
              >
                <span className="block text-[10px] font-sans tracking-[0.3em] text-[#8E8D8A] uppercase font-bold mb-1">
                  Daylight Gala Commendation
                </span>
                <p className="font-sans text-[11px] text-[#555] leading-relaxed mb-6">
                  Interactive WebGL exposition. For optimal fidelity, the system will execute soft audio drones and physical day-lighting modules.
                </p>

                <button
                  onClick={handleEnterExperience}
                  className="inline-flex items-center gap-3 bg-[#111] hover:bg-[#222] text-[#FAF9F6] font-sans text-[11px] tracking-[0.25em] font-medium py-4 px-8 rounded-lg uppercase cursor-pointer transition-all shadow-md hover:shadow-xl active:scale-95"
                  id="enter-exposition-btn"
                >
                  ACCEPT VIP INVITATION
                  <ChevronRight className="w-4 h-4 text-champagne" />
                </button>
              </motion.div>
            </div>

            {/* Footer */}
            <div className="flex flex-col md:flex-row justify-between items-center text-[10px] text-[#8E8D8A] font-sans tracking-widest gap-2 z-10">
              <span>© 2026 FOREVER STAR INDIA. ALL RIGHTS SECURED.</span>
              <span className="flex items-center gap-1">
                DESIGN BY VIP EDITORIAL TEAM <ExternalLink className="w-3 h-3 text-[#E1C699] ml-1" />
              </span>
            </div>
          </motion.div>
        ) : (
          /* SECTION 2: THE INTERACTIVE 3D WORLD AND HUD OVERLAY */
          <motion.div
            key="exposition-viewport"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 flex flex-col h-full w-full overflow-hidden"
          >
            {/* Background Architectural Detail & Grid Lines (Editorial Aesthetic Theme with subtle 3D Parallax) */}
            <div className="absolute inset-0 pointer-events-none opacity-40 z-0 overflow-hidden">
              <motion.div 
                animate={{ x: activeSectionIndex * -45 }}
                transition={{ type: "spring", stiffness: 45, damping: 25 }}
                className="absolute top-0 right-[15%] w-[1px] h-full bg-[#E1C699]/25"
              />
              <motion.div 
                animate={{ y: activeSectionIndex * -35 }}
                transition={{ type: "spring", stiffness: 45, damping: 25 }}
                className="absolute top-[40%] left-0 w-full h-[1px] bg-[#E1C699]/25"
              />
              <motion.div 
                animate={{ 
                  x: activeSectionIndex * -75,
                  y: activeSectionIndex * -15,
                  scale: 1 + activeSectionIndex * 0.04,
                  rotate: activeSectionIndex * -1.2,
                }}
                transition={{ type: "spring", stiffness: 35, damping: 24 }}
                className="absolute top-[18%] left-[8%] text-[150px] md:text-[220px] font-serif-display italic text-[#F3F3F1]/80 select-none leading-none tracking-tighter"
              >
                FSIA
              </motion.div>
            </div>

            {/* The 3D Canvas Container */}
            <div className="absolute inset-0 w-full h-full z-0">
              <ThreeGallery
                activeSectionIndex={activeSectionIndex}
                selectedCreator={selectedCreator}
                onSelectCreator={setSelectedCreator}
                onSectionChange={setActiveSectionIndex}
              />
            </div>

            {/* Refracting Crystal Prism Info Widget (Editorial Aesthetic Theme) */}
            <div className="absolute bottom-32 right-12 w-[110px] h-[110px] pointer-events-none hidden md:block z-10 opacity-75">
              <div className="absolute inset-0 rotate-45 border border-[#E1C699]/35 backdrop-blur-sm"></div>
              <div className="absolute inset-3 rotate-[15deg] border border-[#E1C699]/15"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-1.5 h-1.5 bg-[#E1C699] rounded-full animate-ping"></div>
              </div>
              <div className="absolute -top-7 left-0 text-[8px] tracking-[0.4em] uppercase whitespace-nowrap rotate-90 origin-bottom-left text-[#8E8D8A] font-bold">
                REFRACTIVE INDEX: PURE
              </div>
            </div>

            {/* --- HEADS UP DISPLAY HUD: OVERLAID React CONTROLS --- */}

            {/* 1. TOP EDITORIAL BANNER */}
            <header className="absolute top-0 inset-x-0 p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row justify-between items-center gap-4 z-20 pointer-events-none select-none border-b border-black/[0.03] bg-white/10 backdrop-blur-xs">
              <div className="pointer-events-auto flex items-center gap-3 bg-white/60 backdrop-blur-md px-4 py-2 md:px-5 md:py-3.5 rounded-xl border border-black/5 shadow-sm">
                <div className="space-y-0.5">
                  <h1 className="font-serif-display text-base md:text-lg font-bold tracking-tight text-[#111]">
                    FSIA INFLUENCER
                  </h1>
                  <p className="font-sans text-[8px] md:text-[9px] tracking-[0.25em] text-[#888] uppercase font-bold">
                    Forever Star India VIP Desk
                  </p>
                </div>
              </div>

              {/* Dynamic Navigation Tabs */}
              <div className="pointer-events-auto flex items-center overflow-x-auto scrollbar-none gap-1 bg-white/70 backdrop-blur-md px-2 py-1.5 rounded-xl border border-black/5 shadow-sm max-w-full">
                {(["catwalk", "directory", "campaigns", "membership", "faq"] as const).map((tab) => {
                  const isSelected = activeTab === tab;
                  const label = 
                    tab === "catwalk" ? "Catwalk 3D" :
                    tab === "directory" ? "Directory" :
                    tab === "campaigns" ? "Campaigns" :
                    tab === "membership" ? "VIP Membership" : "FAQs";
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setSelectedCreator(null);
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-[9px] md:text-[10px] font-sans font-bold tracking-widest uppercase transition-all cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? "bg-[#111] text-[#FAF9F6] shadow-sm"
                          : "hover:bg-black/5 text-[#666]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Sound & Gateway Options */}
              <div className="pointer-events-auto flex items-center justify-center lg:justify-end gap-2.5 w-full lg:w-auto">
                {/* Custom Synthesizer Toggle */}
                <button
                  onClick={toggleAudio}
                  className={`hud-interactive px-3 py-2.5 md:px-4 md:py-3 rounded-xl backdrop-blur-md border border-black/5 flex items-center gap-2 text-[9px] md:text-[10px] font-sans font-bold tracking-wider uppercase transition-all shadow-sm cursor-pointer ${
                    audioEnabled
                      ? "bg-champagne/15 border border-champagne text-[#111]"
                      : "bg-white/60 hover:bg-white text-[#666]"
                  }`}
                  id="toggle-synth-audio-btn"
                >
                  {audioEnabled ? (
                    <>
                      <Volume2 className="w-4 h-4 text-champagne animate-bounce" />
                      <span className="hidden xs:inline">AMBIENT:</span> ACTIVE
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4 text-[#888]" />
                      <span className="hidden xs:inline">AMBIENT:</span> MUTED
                    </>
                  )}
                </button>

                {/* VIP Collaboration Gateway Trigger */}
                <button
                  onClick={() => setIsCollaborationOpen(true)}
                  className="hud-interactive bg-[#111] hover:bg-[#222] text-[#FAF9F6] font-sans text-[9px] md:text-[10px] tracking-[0.15em] font-bold px-4 py-2.5 md:px-5 md:py-3 rounded-xl shadow-md cursor-pointer flex items-center gap-2 uppercase active:scale-95"
                  id="open-collaboration-form-btn"
                >
                  <FileText className="w-4 h-4 text-champagne" />
                  VIP REGISTER
                </button>
              </div>
            </header>

            {/* 2. LEFT PANEL: EDITORIAL INDEX SELECTOR */}
            {activeTab === "catwalk" && (
              <nav className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-6 z-10 pointer-events-none">
                <div className="hud-interactive bg-white/45 backdrop-blur-md p-6 rounded-2xl border border-black/5 shadow-sm flex flex-col gap-5 pointer-events-auto">
                  <span className="block text-[9px] font-sans tracking-[0.3em] text-[#8E8D8A] uppercase font-bold border-b border-black/5 pb-2">
                    RUNWAY STATIONS
                  </span>
                  {gallerySections.map((sec, idx) => {
                    const isActive = idx === activeSectionIndex;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => {
                          setActiveSectionIndex(idx);
                          setSelectedCreator(null); // release closeup view
                        }}
                        className="group flex items-center gap-4 text-left cursor-pointer focus:outline-none"
                      >
                        {/* Active gold dot & indicator */}
                        <div className="relative flex items-center justify-center">
                          <div
                            className={`w-2 h-2 rounded-full transition-all duration-500 ${
                              isActive
                                ? "bg-champagne scale-125"
                                : "bg-[#D2CFC9] group-hover:bg-champagne/70"
                            }`}
                          />
                          {isActive && (
                            <span className="absolute w-4 h-4 rounded-full border border-champagne animate-ping opacity-60" />
                          )}
                        </div>

                        {/* Section details */}
                        <div>
                          <span
                            className={`block text-[9px] font-mono tracking-wider transition-colors ${
                              isActive ? "text-champagne font-bold" : "text-[#999]"
                            }`}
                          >
                            0{idx + 1}
                          </span>
                          <span
                            className={`block font-serif-text text-sm transition-colors leading-none mt-0.5 ${
                              isActive
                                ? "text-[#111] font-bold"
                                : "text-[#666] group-hover:text-[#222]"
                            }`}
                          >
                            {sec.title}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </nav>
            )}

            {/* 3. RIGHT PANEL: VIP DIRECTORY STATUS TICKER */}
            {activeTab === "catwalk" && (
              <aside className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4 z-10 pointer-events-none">
                <div className="hud-interactive bg-white/45 backdrop-blur-md p-6 rounded-2xl border border-black/5 shadow-sm flex flex-col gap-4 pointer-events-auto w-64">
                  <span className="block text-[9px] font-sans tracking-[0.3em] text-[#8E8D8A] uppercase font-bold border-b border-black/5 pb-2">
                    VIP ROSTER METRICS
                  </span>

                  <div className="space-y-3">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-sans text-[#888] uppercase tracking-wider block">
                        Combined Roster Reach
                      </span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-champagne" />
                        <span className="font-serif-display text-xl font-bold text-[#111]">
                          8.83 Million
                        </span>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] font-sans text-[#888] uppercase tracking-wider block">
                        Escrow Safeguard
                      </span>
                      <span className="font-serif-text text-xs text-[#222] font-semibold flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-champagne inline" />
                        100% Secure Audited Contracts
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] font-sans text-[#888] uppercase tracking-wider block">
                        Verification Block
                      </span>
                      <span className="font-mono text-[10px] text-[#555] bg-black/5 px-2 py-0.5 rounded">
                        FSIA-SHA256-ACTIVE
                      </span>
                    </div>
                  </div>
                </div>
              </aside>
            )}

            {/* 4. BOTTOM INTERACTIVE NAV & PROGRESS BAR */}
            {activeTab === "catwalk" && (
              <footer className="absolute bottom-0 inset-x-0 p-4 md:p-8 flex flex-col items-center gap-3 z-10 pointer-events-none">
                {/* Dynamic scroll indicator banner if no card selected */}
                {!selectedCreator && (
                  <div className="bg-white/45 backdrop-blur-md border border-black/5 shadow-sm px-4 py-2 md:px-5 md:py-2.5 rounded-full flex items-center gap-2 text-[9px] md:text-[10px] font-sans text-[#666] tracking-widest uppercase animate-bounce pointer-events-auto">
                    <Compass className="w-4 h-4 text-champagne animate-spin-slow" />
                    <span className="hidden xs:inline">Scroll / Wheel Drag to</span> Glide Catwalk
                  </div>
                )}

                {/* Catwalk controls container */}
                <div className="hud-interactive w-full max-w-4xl bg-white/45 backdrop-blur-md px-4 py-3 md:px-6 md:py-4 rounded-2xl border border-black/5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4 pointer-events-auto">
                  {/* Arrow navigation triggers */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                    <button
                      onClick={handlePrevSection}
                      disabled={activeSectionIndex === 0}
                      className="w-10 h-10 rounded-full bg-white/60 hover:bg-white border border-black/5 flex items-center justify-center text-[#222] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer flex-shrink-0"
                      id="prev-section-btn"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="text-center sm:text-left min-w-[140px] md:min-w-[200px]">
                      <span className="block text-[8px] font-mono text-[#888] uppercase tracking-widest">
                        ACTIVE SECTION — {activeSectionIndex + 1} / 3
                      </span>
                      <span className="block font-serif-display text-xs md:text-sm font-bold text-[#111] truncate max-w-[180px] md:max-w-none">
                        {activeSection.title}
                      </span>
                    </div>
                    <button
                      onClick={handleNextSection}
                      disabled={activeSectionIndex === gallerySections.length - 1}
                      className="w-10 h-10 rounded-full bg-white/60 hover:bg-white border border-black/5 flex items-center justify-center text-[#222] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer flex-shrink-0"
                      id="next-section-btn"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Elegant Runway Catwalk Progress Slider */}
                  <div className="hidden sm:block flex-1 max-w-sm w-full space-y-1">
                    <div className="flex justify-between text-[8px] font-sans text-[#888] tracking-widest uppercase font-bold">
                      <span>CATWALK ENTRANCE</span>
                      <span>VIP ARCHIVE</span>
                    </div>
                    <div className="relative h-1 bg-[#E3E2DE] rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-champagne transition-all duration-700 ease-out"
                        style={{
                          width: `${((activeSectionIndex + 1) / gallerySections.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </footer>
            )}

            {/* --- CORE TAB CONTENT PAGES FOR NON-CATWALK VIEWS --- */}
            <AnimatePresence mode="wait">
              {activeTab !== "catwalk" && (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute inset-0 top-36 lg:top-28 bottom-0 overflow-y-auto px-4 md:px-8 pb-16 z-15 pointer-events-auto bg-[#FAF9F6] scrollbar-thin scrollbar-thumb-black/10"
                >
                  {activeTab === "directory" && (
                    <DirectoryTab
                      onOpenCollaboration={(creatorName) => {
                        setIsCollaborationOpen(true);
                      }}
                      onSelectCreator={(creator) => {
                        setSelectedCreator(creator);
                      }}
                    />
                  )}
                  {activeTab === "campaigns" && <CampaignsTab />}
                  {activeTab === "membership" && <MembershipTab />}
                  {activeTab === "faq" && <FaqTab />}
                </motion.div>
              )}
            </AnimatePresence>

            {/* --- DETAILED DIALOG MODAL ON FOCUSED CREATOR CLICK --- */}
            <AnimatePresence>
              {selectedCreator && (
                <CreatorDetailPanel
                  key={selectedCreator.name}
                  creator={selectedCreator}
                  onClose={() => setSelectedCreator(null)}
                  onOpenCollaboration={() => setIsCollaborationOpen(true)}
                />
              )}
            </AnimatePresence>

            {/* --- SECURE COLLABORATION GATEWAY MODAL DRAWER --- */}
            <VipCollaborationForm
              isOpen={isCollaborationOpen}
              onClose={() => setIsCollaborationOpen(false)}
              preselectedCreator={selectedCreator}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
