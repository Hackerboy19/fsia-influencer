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
  ExternalLink,
  Users,
  Briefcase,
  HelpCircle,
  Lock,
  UserPlus
} from "lucide-react";
import { gallerySections, Creator } from "./data";
import ThreeGallery from "./components/ThreeGallery";
import CreatorDetailPanel from "./components/CreatorDetailPanel";
import VipCollaborationForm from "./components/VipCollaborationForm";
import DirectoryTab from "./components/DirectoryTab";
import CampaignsTab from "./components/CampaignsTab";
import MembershipTab from "./components/MembershipTab";
import ModelRegistrationTab from "./components/ModelRegistrationTab";
import FaqTab from "./components/FaqTab";
import AdminTab from "./components/AdminTab";
import CursorParticleTrail from "./components/CursorParticleTrail";
import { Toaster } from "react-hot-toast";

export default function App() {
  // Navigation & Showcase States
  const [hasEntered, setHasEntered] = useState(false);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isCollaborationOpen, setIsCollaborationOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"catwalk" | "directory" | "campaigns" | "membership" | "faq" | "admin" | "apply">("catwalk");

  // Dynamic full-stack database roster state
  const [sections, setSections] = useState<any[]>(gallerySections);

  // Enterprise Dynamic Configuration Settings State
  const [settings, setSettings] = useState<any>({
    websiteTitle: "FSIA — Forever Star India Awards",
    heroTitle: "FSIA VIP GALLERY",
    heroSubtitle: "Immerse in a sun-drenched architectural pavilion of verified Brand Campaign victors, social champions, and elite digital authorities.",
    ctaText: "ACCEPT VIP INVITATION",
    footerText: "© 2026 FOREVER STAR INDIA. ALL RIGHTS SECURED.",
    logoUrl: "",
    primaryColor: "#E1C699",
    secondaryColor: "#111111"
  });

  const refreshSections = () => {
    fetch("/api/creators")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setSections(data);
        }
      })
      .catch(() => console.log("Using static local runway fallback."));
  };

  useEffect(() => {
    refreshSections();

    // 2. Fetch enterprise dynamic configurations
    fetch("/api/settings")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => {
        if (data && data.websiteTitle) {
          setSettings(data);
        }
      })
      .catch(() => console.log("Using local fallback settings configuration."));
  }, [activeTab]);

  useEffect(() => {
    window.addEventListener("sections-updated", refreshSections);
    
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener("change-tab", handleTabChange);

    return () => {
      window.removeEventListener("sections-updated", refreshSections);
      window.removeEventListener("change-tab", handleTabChange);
    };
  }, []);

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

  // Auto clean audio on unmount and register global custom events
  useEffect(() => {
    const handleOpenVIP = () => {
      setIsCollaborationOpen(true);
    };
    window.addEventListener("open-vip-collaboration", handleOpenVIP);

    return () => {
      window.removeEventListener("open-vip-collaboration", handleOpenVIP);
      if (synthRef.current) {
        try {
          synthRef.current.ctx.close();
        } catch (e) {}
      }
    };
  }, []);

  // Light, high-frequency 'crystal chime' feedback sound for premium interaction feedback
  const playCrystalChime = () => {
    if (!audioEnabled || !synthRef.current) return;
    try {
      const { ctx } = synthRef.current;
      if (!ctx || ctx.state === "closed") return;

      const now = ctx.currentTime;
      // High-frequency chime harmonic frequencies
      const frequencies = [1800, 2600, 3400];

      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.0, now);

        // Pristine, fast crystal bell-like envelope
        const peakGain = idx === 0 ? 0.025 : idx === 1 ? 0.015 : 0.01;
        gainNode.gain.linearRampToValueAtTime(peakGain, now + 0.006);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.35 + idx * 0.08);

        osc.connect(gainNode);
        // Connect directly to the destination to bypass the 260Hz lowpass filter!
        gainNode.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.8);
      });
    } catch (e) {
      console.warn("Crystal chime playback error:", e);
    }
  };

  const handleEnterExperience = () => {
    setHasEntered(true);
    // Automatically trigger ambient audio to immerse the visitor
    startAmbientSynth();
  };

  const activeSection = sections[activeSectionIndex] || sections[0] || { id: "none", title: "No Category", creators: [], primaryColor: "#E1C699" };

  // Glide through runway sections
  const handlePrevSection = () => {
    if (activeSectionIndex > 0) {
      setActiveSectionIndex(activeSectionIndex - 1);
      playCrystalChime();
    }
  };

  const handleNextSection = () => {
    if (activeSectionIndex < sections.length - 1) {
      setActiveSectionIndex(activeSectionIndex + 1);
      playCrystalChime();
    }
  };

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden bg-alabaster font-sans text-[#111] select-none snap-y snap-mandatory"
      style={{
        ["--color-champagne" as any]: settings.primaryColor || "#E1C699",
        scrollSnapType: "y mandatory"
      }}
    >
      <Toaster position="top-right" reverseOrder={false} toastOptions={{ duration: 4000 }} />
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
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(var(--color-champagne)_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] border border-champagne/15 rounded-full pointer-events-none" />
            <CursorParticleTrail color={settings.primaryColor || "#E1C699"} />

            {/* Top Branding Header */}
            <div className="flex justify-between items-center z-10">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-6 object-contain" />
              ) : (
                <span className="font-sans text-xs tracking-[0.35em] text-[#8E8D8A] uppercase font-bold">
                  {settings.websiteTitle}
                </span>
              )}
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
                  className="font-serif-display text-4xl md:text-6xl lg:text-7xl font-light tracking-tight text-[#111] leading-[1.05] uppercase"
                >
                  {settings.heroTitle}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="font-serif-text italic text-base md:text-xl text-[#666] max-w-2xl mx-auto leading-relaxed"
                >
                  {settings.heroSubtitle}
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
                  {settings.ctaText}
                  <ChevronRight className="w-4 h-4 text-champagne" />
                </button>
              </motion.div>
            </div>

            {/* Footer */}
            <div className="flex flex-col md:flex-row justify-between items-center text-[10px] text-[#8E8D8A] font-sans tracking-widest gap-2 z-10">
              <span className="uppercase">{settings.footerText}</span>
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
                sections={sections}
                activeSectionIndex={activeSectionIndex}
                selectedCreator={selectedCreator}
                onSelectCreator={setSelectedCreator}
                onSectionChange={setActiveSectionIndex}
              />
              <CursorParticleTrail active={activeTab === "catwalk"} color={settings.primaryColor || "#E1C699"} />
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

            {/* 1. TOP EDITORIAL BANNER */}
            <header className="absolute top-0 inset-x-0 p-2 sm:p-4 md:p-5 lg:p-8 flex flex-col lg:flex-row justify-between items-center gap-2 sm:gap-3 md:gap-4 z-20 pointer-events-none select-none border-b border-black/[0.03] bg-white/20 backdrop-blur-xs">
              {/* Top Row on Mobile: Logo & Actions */}
              <div className="flex items-center justify-between w-full lg:w-auto gap-2 sm:gap-4 pointer-events-auto">
                {/* Logo */}
                <div 
                  onDoubleClick={() => {
                    setActiveTab("admin");
                    setSelectedCreator(null);
                    playCrystalChime();
                  }}
                  title="Double click for Administrative workspace"
                  className="flex items-center gap-1.5 sm:gap-2.5 bg-white/70 backdrop-blur-md px-2.5 py-1.5 sm:px-5 sm:py-3 rounded-xl border border-black/5 shadow-sm cursor-pointer hover:border-black/10 transition-all select-none"
                >
                  <div className="space-y-0.5">
                    <h1 className="font-serif-display text-[10px] sm:text-xs md:text-base lg:text-lg font-bold tracking-tight text-[#111] leading-none">
                      FSIA INFLUENCER
                    </h1>
                    <p className="font-sans text-[6px] sm:text-[7px] md:text-[9px] tracking-[0.2em] text-[#888] uppercase font-bold leading-none max-[350px]:hidden">
                      By FOREVER STAR INDIA
                    </p>
                  </div>
                </div>

                {/* Buttons: Sound & VIP Register (shown next to logo on mobile/tablet, right-aligned on desktop) */}
                <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden">
                  {/* Custom Synthesizer Toggle */}
                  <button
                    onClick={toggleAudio}
                    className="px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-lg backdrop-blur-md border border-black/5 flex items-center justify-center text-[#666] bg-white/70 hover:bg-white cursor-pointer"
                    id="toggle-synth-audio-btn-mobile"
                    title="Ambient Sound"
                  >
                    {audioEnabled ? (
                      <Volume2 className="w-3.5 h-3.5 text-champagne" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-[#888]" />
                    )}
                  </button>

                  {/* Subtle Admin Entrance Mobile */}
                  <button
                    onClick={() => {
                      setActiveTab("admin");
                      setSelectedCreator(null);
                      playCrystalChime();
                    }}
                    className="px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-lg backdrop-blur-md border border-black/5 flex items-center justify-center text-[#8e8d8a] bg-white/70 hover:text-black hover:bg-white cursor-pointer"
                    title="Administrative Workspace"
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </button>

                  {/* FSIA Portal Mobile */}
                  <a
                    href="https://www.fsia.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-lg backdrop-blur-md border border-black/10 flex items-center justify-center text-[#111] bg-white hover:bg-stone-50 cursor-pointer"
                    title="FSIA Portal"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {/* VIP Collaboration Gateway Trigger */}
                  <button
                    onClick={() => setIsCollaborationOpen(true)}
                    className="bg-[#111] hover:bg-[#222] text-[#FAF9F6] font-sans text-[8px] sm:text-[9px] tracking-[0.1em] font-bold px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg shadow-xs cursor-pointer flex items-center gap-1 uppercase active:scale-95"
                    id="open-collaboration-form-btn-mobile"
                  >
                    <FileText className="w-3.5 h-3.5 text-champagne" />
                    <span className="hidden min-[400px]:inline">VIP REGISTER</span>
                  </button>
                </div>
              </div>

              {/* Center Navigation Tabs (scrollable on mobile, centered on desktop) */}
              <div className="pointer-events-auto flex items-center overflow-x-auto scrollbar-none gap-1 bg-white/70 backdrop-blur-md px-1.5 py-1 rounded-xl border border-black/5 shadow-xs w-full lg:w-auto max-w-full justify-start lg:justify-center">
                {(["catwalk", "directory", "campaigns", "membership", "apply", "faq"] as const).map((tab) => {
                  const isSelected = activeTab === tab;
                  const label = 
                    tab === "catwalk" ? "Agency Services" :
                    tab === "directory" ? "Talent Roster" :
                    tab === "campaigns" ? "Campaigns" :
                    tab === "membership" ? "VIP Membership" :
                    tab === "apply" ? "Get Verified" : "FAQs";
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setSelectedCreator(null);
                        playCrystalChime();
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[8px] md:text-[10px] font-sans font-bold tracking-widest uppercase transition-all cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? "bg-[#111] text-[#FAF9F6] shadow-xs"
                          : "hover:bg-black/5 text-[#666]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Actions on Desktop Only */}
              <div className="hidden lg:flex pointer-events-auto items-center justify-end gap-2.5 lg:w-auto">
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

                {/* Subtle Admin Entrance Desktop */}
                <button
                  onClick={() => {
                    setActiveTab("admin");
                    setSelectedCreator(null);
                    playCrystalChime();
                  }}
                  className={`hud-interactive px-3 py-2.5 md:px-4 md:py-3 rounded-xl backdrop-blur-md border border-black/5 flex items-center justify-center text-[#8e8d8a] hover:text-black hover:bg-white/60 transition-all shadow-sm cursor-pointer ${
                    activeTab === "admin" ? "bg-white text-black border-black/25" : "bg-white/60"
                  }`}
                  title="Administrative Portal Entrance"
                >
                  <Lock className="w-4 h-4" />
                </button>

                {/* FSIA Portal Button */}
                <a
                  href="https://www.fsia.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hud-interactive px-3 py-2.5 md:px-4 md:py-3 rounded-xl backdrop-blur-md border border-black/10 flex items-center justify-center text-[#111] bg-white hover:bg-stone-50 transition-all shadow-sm cursor-pointer text-[9px] md:text-[10px] font-sans font-bold tracking-wider uppercase"
                >
                  FSIA Portal
                </a>

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
              <nav className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-6 z-10 pointer-events-none max-h-[80vh] overflow-y-auto scrollbar-none">
                <div className="hud-interactive bg-white/45 backdrop-blur-md p-6 rounded-2xl border border-black/5 shadow-sm flex flex-col gap-5 pointer-events-auto pb-8">
                  <span className="block text-[9px] font-sans tracking-[0.3em] text-[#8E8D8A] uppercase font-bold border-b border-black/5 pb-2">
                    RUNWAY STATIONS
                  </span>
                  {sections.map((sec, idx) => {
                    const isActive = idx === activeSectionIndex;
                    return (
                      <button
                        key={`${sec.id}-${idx}`}
                        onClick={() => {
                          setActiveSectionIndex(idx);
                          setSelectedCreator(null); // release closeup view
                          playCrystalChime();
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

            {/* Horizontal Runway Category Selector for Mobile/Tablet */}
            {activeTab === "catwalk" && (
              <div className="absolute top-[112px] sm:top-[120px] left-0 right-0 lg:hidden z-20 pointer-events-none flex justify-start px-4">
                <div className="pointer-events-auto bg-white/70 backdrop-blur-md pl-3 pr-8 py-1.5 rounded-xl border border-black/5 shadow-xs flex gap-2 overflow-x-auto scrollbar-none max-w-full items-center">
                  {sections.map((sec, idx) => {
                    const isActive = idx === activeSectionIndex;
                    return (
                      <button
                        key={`${sec.id}-${idx}`}
                        onClick={() => {
                          setActiveSectionIndex(idx);
                          setSelectedCreator(null);
                          playCrystalChime();
                        }}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-sans font-bold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                          isActive
                            ? "bg-[#111] text-[#FAF9F6] shadow-2xs"
                            : "bg-white/40 hover:bg-white/80 text-[#666]"
                        }`}
                      >
                        <span 
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: sec.primaryColor || "#E1C699" }} 
                        />
                        {sec.title}
                      </button>
                    );
                  })}
                  {/* Elegant safe-area horizontal scroll spacing for the Verified VIP Influencers category */}
                  <div className="w-8 flex-shrink-0 h-1" aria-hidden="true" />
                </div>
              </div>
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
              <footer className="absolute bottom-20 lg:bottom-0 inset-x-0 p-4 md:p-8 flex flex-col items-center gap-3 z-10 pointer-events-none">
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
                        ACTIVE SECTION — {activeSectionIndex + 1} / {sections.length}
                      </span>
                      <span className="block font-serif-display text-xs md:text-sm font-bold text-[#111] truncate max-w-[180px] md:max-w-none">
                        {activeSection.title}
                      </span>
                    </div>
                    <button
                      onClick={handleNextSection}
                      disabled={activeSectionIndex === sections.length - 1}
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
                          width: `${((activeSectionIndex + 1) / sections.length) * 100}%`,
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
                  className="absolute inset-0 top-[115px] sm:top-[125px] lg:top-28 bottom-0 overflow-y-auto px-4 md:px-8 pb-36 sm:pb-28 z-15 pointer-events-auto bg-[#FAF9F6] scrollbar-thin scrollbar-thumb-black/10"
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
                  {activeTab === "apply" && <ModelRegistrationTab />}
                  {activeTab === "faq" && <FaqTab />}
                  {activeTab === "admin" && <AdminTab />}
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

            {/* Back to Catwalk Floating Action Button (FAB) on Mobile when not on catwalk */}
            <AnimatePresence>
              {activeTab !== "catwalk" && (
                <motion.button
                  key="back-to-catwalk-fab"
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  onClick={() => {
                    setActiveTab("catwalk");
                    setSelectedCreator(null);
                  }}
                  className="fixed bottom-24 right-6 bg-[#111] hover:bg-[#222] text-champagne border border-[#E1C699]/35 px-4 py-3 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.35)] z-50 flex items-center gap-2 font-sans text-[10px] font-bold tracking-widest uppercase lg:hidden pointer-events-auto active:scale-95"
                >
                  <Compass className="w-4 h-4 text-champagne animate-spin-slow" />
                  Back to Catwalk
                </motion.button>
              )}
            </AnimatePresence>

            {/* --- MAJESTIC FLOATING MOBILE BOTTOM NAVIGATION BAR --- */}
            <div className="fixed bottom-4 inset-x-4 h-16 bg-[#111]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center justify-around px-3 z-50 lg:hidden pointer-events-auto">
              {[
                { id: "catwalk", label: "Agency Services", icon: Compass },
                { id: "directory", label: "Talent Roster", icon: Users },
                { id: "campaigns", label: "Campaigns", icon: Briefcase },
                { id: "apply", label: "Get Verified", icon: UserPlus },
                { id: "membership", label: "VIP Club", icon: Sparkles },
              ].map((item) => {
                const isSelected = activeTab === item.id;
                const Icon = item.icon;
                
                // Audio chime feedback wrapper
                const playCrystalChime = () => {
                  try {
                    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(880, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
                    gain.gain.setValueAtTime(0.01, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.35);
                  } catch (e) {}
                };

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setSelectedCreator(null);
                      playCrystalChime();
                    }}
                    className="flex flex-col items-center justify-center flex-1 h-full relative cursor-pointer group"
                  >
                    <div className={`p-1 rounded-xl transition-all duration-300 ${isSelected ? "text-champagne scale-110" : "text-[#8e8d8a] hover:text-white"}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[8px] font-sans font-bold tracking-widest uppercase transition-colors duration-300 ${isSelected ? "text-champagne font-extrabold" : "text-[#8e8d8a]"}`}>
                      {item.label}
                    </span>
                    {isSelected && (
                      <motion.div
                        layoutId="activeMobileTabDot"
                        className="absolute bottom-1 w-1 h-1 rounded-full bg-champagne"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
