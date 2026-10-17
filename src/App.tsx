import React, { useState, useRef, useEffect, lazy, Suspense } from "react";
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
  UserPlus
} from "lucide-react";
import { gallerySections, Creator } from "./data";
import CreatorDetailPanel from "./components/CreatorDetailPanel";
import VipCollaborationForm from "./components/VipCollaborationForm";
import MoodboardModal from "./components/MoodboardModal";
import DirectoryTab from "./components/DirectoryTab";
import CampaignsTab from "./components/CampaignsTab";
import MembershipTab from "./components/MembershipTab";
import ModelRegistrationTab from "./components/ModelRegistrationTab";
import FaqTab from "./components/FaqTab";
import CursorParticleTrail from "./components/CursorParticleTrail";
import SiteFooter from "./components/SiteFooter";
import { Toaster } from "react-hot-toast";
import { TabId, routeForPath, routeForTab, applyRouteMeta } from "./seo";

// The 3D scene (Three.js) and the admin workspace are loaded on demand, so the
// welcome screen and content pages don't wait for code most visitors never run
const ThreeGallery = lazy(() => import("./components/ThreeGallery"));
const AdminTab = lazy(() => import("./components/AdminTab"));

const MOBILE_NAV: { id: TabId; label: string; icon: typeof Compass }[] = [
  { id: "catwalk", label: "Explore", icon: Compass },
  { id: "directory", label: "Talent", icon: Users },
  { id: "campaigns", label: "Campaigns", icon: Briefcase },
  { id: "apply", label: "Join", icon: UserPlus },
  { id: "membership", label: "Plans", icon: Sparkles }
];

const ENTERED_KEY = "fsia_entered";

function readEntered(): boolean {
  try {
    return sessionStorage.getItem(ENTERED_KEY) === "1";
  } catch {
    return false;
  }
}

export default function App() {
  // Navigation & Showcase States
  // Deep links (/talent/, /join/ …) and return visits skip the welcome screen
  const initialTab = routeForPath(window.location.pathname).tab;
  const [hasEntered, setHasEntered] = useState(initialTab !== "catwalk" || readEntered());
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isCollaborationOpen, setIsCollaborationOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [moodboardItems, setMoodboardItems] = useState<string[]>([]);
  const [isMoodboardOpen, setIsMoodboardOpen] = useState(false);

  // Dynamic full-stack database roster state
  const [sections, setSections] = useState<any[]>(gallerySections);

  // Enterprise Dynamic Configuration Settings State
  const [settings, setSettings] = useState<any>({
    websiteTitle: "FSIA Creators & Influencer Portal",
    heroTitle: "FSIA INFLUENCER",
    heroSubtitle: "Connect with verified creators, launch brand campaigns and grow your influence.",
    ctaText: "EXPLORE THE PORTAL",
    footerText: "© 2026 FSIA Influencer. All rights reserved.",
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
    const savedMoodboard = sessionStorage.getItem("fsia_moodboard");
    if (savedMoodboard) {
      try {
        setMoodboardItems(JSON.parse(savedMoodboard));
      } catch(e) {}
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem("fsia_moodboard", JSON.stringify(moodboardItems));
  }, [moodboardItems]);

  useEffect(() => {
    window.addEventListener("sections-updated", refreshSections);
    
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener("change-tab", handleTabChange);

    const handleToggleMoodboard = (e: Event) => {
      const customEvent = e as CustomEvent;
      const url = customEvent.detail;
      setMoodboardItems(prev => {
        if (prev.includes(url)) {
          return prev.filter(u => u !== url);
        }
        return [...prev, url];
      });
    };
    window.addEventListener("toggle-moodboard", handleToggleMoodboard);

    const handleOpenMoodboard = () => setIsMoodboardOpen(true);
    window.addEventListener("open-moodboard", handleOpenMoodboard);

    return () => {
      window.removeEventListener("sections-updated", refreshSections);
      window.removeEventListener("change-tab", handleTabChange);
      window.removeEventListener("toggle-moodboard", handleToggleMoodboard);
      window.removeEventListener("open-moodboard", handleOpenMoodboard);
    };
  }, []);

  // Keep the address bar and <head> (title, description, canonical, OG) in sync with the section
  useEffect(() => {
    const route = routeForTab(activeTab);
    // Title/meta first: Google Analytics records the page view when the URL changes
    applyRouteMeta(route);
    if (window.location.pathname !== route.path) {
      window.history.pushState({ tab: activeTab }, "", route.path);
    }
    contentScrollRef.current?.scrollTo({ top: 0 });
    // Bring the current tab into view in the scrollable tab row. Scrolling the row
    // itself (not scrollIntoView) keeps the browser's Tab starting point at the top
    // of the page, so the "Skip to main content" link stays the first Tab stop.
    const nav = document.getElementById("main-nav-tabs");
    const current = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav && current && nav.scrollWidth > nav.clientWidth) {
      const left = current.getBoundingClientRect().left - nav.getBoundingClientRect().left + nav.scrollLeft;
      nav.scrollTo({ left: Math.max(0, left - (nav.clientWidth - current.offsetWidth) / 2) });
    }
  }, [activeTab]);

  useEffect(() => {
    const onPopState = () => {
      setActiveTab(routeForPath(window.location.pathname).tab);
      setSelectedCreator(null);
      setHasEntered(true);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigateTo = (tab: TabId) => {
    setHasEntered(true);
    setActiveTab(tab);
    setSelectedCreator(null);
  };

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

  // Entering never auto-plays sound; visitors can switch ambient audio on from the header
  const handleEnterExperience = (tab: TabId = "catwalk", openEnquiry = false) => {
    try {
      sessionStorage.setItem(ENTERED_KEY, "1");
    } catch {}
    navigateTo(tab);
    if (openEnquiry) setIsCollaborationOpen(true);
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
                <span className="font-sans text-xs tracking-[0.3em] text-[#111] uppercase font-bold">
                  {settings.websiteTitle}
                </span>
              )}
              <span className="px-3.5 py-1 rounded-full border border-champagne/30 text-[11px] font-sans text-champagne uppercase font-bold tracking-[0.2em]">
                VIP Tier Access
              </span>
            </div>

            {/* Central Invitation Box */}
            <main className="max-w-3xl mx-auto text-center space-y-10 z-10 px-4">
              <div className="space-y-4">
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 text-xs font-sans tracking-[0.4em] text-champagne font-bold uppercase"
                >
                  <Sparkles className="w-4.5 h-4.5 animate-pulse text-champagne" />
                  Creators &amp; Influencer Portal
                </motion.span>
                <motion.h1
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="font-serif-display text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight text-[#111] leading-[1.05] uppercase"
                >
                  {settings.heroTitle}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="font-serif-text text-lg md:text-2xl text-[#2e2c29] max-w-2xl mx-auto leading-relaxed"
                >
                  {settings.heroSubtitle}
                </motion.p>
              </div>

              {/* Entry choices: one clear primary action, two direct shortcuts */}
              <motion.div
                initial={{ scale: 0.97, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col items-center gap-4"
              >
                <button
                  onClick={() => handleEnterExperience()}
                  className="inline-flex items-center gap-3 bg-[#111] hover:bg-[#222] text-[#FAF9F6] font-sans text-[13px] tracking-[0.12em] sm:tracking-[0.2em] font-semibold py-4 px-7 sm:px-9 rounded-xl uppercase whitespace-nowrap cursor-pointer transition-all shadow-md hover:shadow-xl active:scale-95"
                  id="enter-exposition-btn"
                >
                  {settings.ctaText}
                  <ChevronRight className="w-4 h-4 text-champagne" />
                </button>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={() => handleEnterExperience("apply")}
                    className="inline-flex items-center gap-2 bg-white border-2 border-[#111] text-[#111] hover:bg-[#111] hover:text-white font-sans text-[13px] font-semibold py-3 px-6 rounded-xl cursor-pointer transition-colors"
                  >
                    <UserPlus className="w-4 h-4" /> I'm a creator — join
                  </button>
                  <button
                    onClick={() => handleEnterExperience("directory", true)}
                    className="inline-flex items-center gap-2 bg-white border-2 border-[#111] text-[#111] hover:bg-[#111] hover:text-white font-sans text-[13px] font-semibold py-3 px-6 rounded-xl cursor-pointer transition-colors"
                  >
                    <Briefcase className="w-4 h-4" /> I'm a brand — enquire
                  </button>
                </div>
              </motion.div>
            </main>

            {/* Footer */}
            <div className="z-10">
              <SiteFooter
                compact
                footerText={settings.footerText}
                onNavigate={(tab) => handleEnterExperience(tab)}
                onBrandEnquiry={() => handleEnterExperience("directory", true)}
              />
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

            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:bg-[#111] focus:text-white focus:px-4 focus:py-2.5 focus:rounded-lg focus:text-sm focus:font-semibold"
            >
              Skip to main content
            </a>

            {/* The 3D Canvas Container (the page's main content on the Explore view) */}
            <div
              className="absolute inset-0 w-full h-full z-0"
              role={activeTab === "catwalk" ? "main" : undefined}
              id={activeTab === "catwalk" ? "main-content" : undefined}
              tabIndex={activeTab === "catwalk" ? -1 : undefined}
            >
              {activeTab === "catwalk" && <h1 className="sr-only">FSIA Creators &amp; Influencer Portal</h1>}
              <Suspense fallback={null}>
                <ThreeGallery
                  sections={sections}
                  activeSectionIndex={activeSectionIndex}
                  selectedCreator={selectedCreator}
                  onSelectCreator={setSelectedCreator}
                  onSectionChange={setActiveSectionIndex}
                />
              </Suspense>
              <CursorParticleTrail active={activeTab === "catwalk"} color={settings.primaryColor || "#E1C699"} />
            </div>

            {/* Refracting Crystal Prism Info Widget (Editorial Aesthetic Theme) */}
            <div className="absolute bottom-32 right-12 w-[110px] h-[110px] pointer-events-none hidden md:block z-10 opacity-75">
              <div className="absolute inset-0 rotate-45 border border-[#E1C699]/35 backdrop-blur-sm"></div>
              <div className="absolute inset-3 rotate-[15deg] border border-[#E1C699]/15"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-1.5 h-1.5 bg-[#E1C699] rounded-full animate-ping"></div>
              </div>
              <div className="absolute -top-7 left-0 text-[11px] tracking-[0.4em] uppercase whitespace-nowrap rotate-90 origin-bottom-left text-[#8E8D8A] font-bold">
                REFRACTIVE INDEX: PURE
              </div>
            </div>

            {/* 1. TOP EDITORIAL BANNER */}
            <header className="absolute top-0 inset-x-0 p-2 sm:p-4 md:p-4 xl:p-8 flex flex-col xl:flex-row justify-between items-center gap-2 sm:gap-3 md:gap-4 xl:gap-3 z-20 pointer-events-none select-none border-b border-black/[0.03] bg-white/20 backdrop-blur-xs">
              {/* Top Row on Mobile: Logo & Actions. (No admin button for visitors: the
                  admin workspace is opened directly at /admin/.) */}
              <div className="flex items-center justify-between w-full xl:w-auto xl:shrink-0 gap-2 sm:gap-4 pointer-events-auto">
                {/* Logo: home link */}
                <a
                  href="/"
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                    e.preventDefault();
                    navigateTo("catwalk");
                    playCrystalChime();
                  }}
                  aria-label="FSIA Influencer — home"
                  className="flex items-center gap-1.5 sm:gap-2.5 bg-white/85 backdrop-blur-md px-2.5 py-1.5 sm:px-5 sm:py-3 rounded-xl border border-black/10 shadow-sm cursor-pointer hover:border-black/25 transition-all select-none"
                >
                  <div className="space-y-0.5">
                    <p className="font-serif-display text-[12px] sm:text-sm md:text-base lg:text-lg font-bold tracking-tight text-[#111] leading-none whitespace-nowrap">
                      FSIA INFLUENCER
                    </p>
                    <p className="font-sans text-[10px] sm:text-[11px] tracking-[0.1em] text-[#47453f] uppercase font-bold leading-none whitespace-nowrap max-[399px]:hidden">
                      Creators &amp; Influencer Portal
                    </p>
                  </div>
                </a>

                {/* Buttons: Sound & Brand Enquiry (shown next to logo on mobile/tablet, right-aligned on desktop) */}
                <div className="flex items-center gap-1.5 sm:gap-2 xl:hidden">
                  {/* Custom Synthesizer Toggle */}
                  <button
                    onClick={toggleAudio}
                    className="min-w-8 min-h-8 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-lg backdrop-blur-md border border-black/10 flex items-center justify-center text-[#2e2c29] bg-white/85 hover:bg-white cursor-pointer"
                    id="toggle-synth-audio-btn-mobile"
                    title="Ambient Sound"
                    aria-label={audioEnabled ? "Mute ambient sound" : "Play ambient sound"}
                    aria-pressed={audioEnabled}
                  >
                    {audioEnabled ? (
                      <Volume2 className="w-4 h-4 text-champagne" aria-hidden="true" />
                    ) : (
                      <VolumeX className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>

                  {/* FSIA Portal Mobile */}
                  <a
                    href="https://www.fsia.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-8 min-h-8 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-lg backdrop-blur-md border border-black/10 flex items-center justify-center text-[#111] bg-white hover:bg-stone-50 cursor-pointer"
                    title="FSIA Portal"
                    aria-label="FSIA Portal (opens in a new tab)"
                  >
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  </a>

                  {/* Brand enquiry (opens the collaboration form) */}
                  <button
                    onClick={() => setIsCollaborationOpen(true)}
                    className="min-w-8 min-h-8 bg-[#111] hover:bg-[#222] text-[#FAF9F6] font-sans text-[11px] tracking-[0.08em] font-bold px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg shadow-xs cursor-pointer flex items-center justify-center gap-1 uppercase active:scale-95"
                    id="open-collaboration-form-btn-mobile"
                    aria-label="Brand enquiry"
                  >
                    <FileText className="w-4 h-4 text-champagne" aria-hidden="true" />
                    <span className="hidden min-[480px]:inline">Brand enquiry</span>
                  </button>
                </div>
              </div>

              {/* Navigation tabs: left-aligned and scrollable whenever they don't fit (centring would crop both ends) */}
              <nav
                aria-label="Main"
                id="main-nav-tabs"
                className="pointer-events-auto flex items-center overflow-x-auto scrollbar-none gap-0.5 xl:gap-1 bg-white/85 backdrop-blur-md px-1.5 py-1 rounded-xl border border-black/5 shadow-xs w-full xl:w-auto xl:flex-initial xl:min-w-0 max-w-full justify-start"
              >
                {(["catwalk", "directory", "campaigns", "membership", "apply", "faq"] as const).map((tab) => {
                  const isSelected = activeTab === tab;
                  // Short labels so all six tabs fit on laptop screens without scrolling
                  const label =
                    tab === "catwalk" ? "Explore" :
                    tab === "directory" ? "Talent" :
                    tab === "campaigns" ? "Campaigns" :
                    tab === "membership" ? "Membership" :
                    tab === "apply" ? "Get Verified" : "FAQs";
                  return (
                    <a
                      key={tab}
                      href={routeForTab(tab).path}
                      aria-current={isSelected ? "page" : undefined}
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                        e.preventDefault();
                        setActiveTab(tab);
                        setSelectedCreator(null);
                        playCrystalChime();
                      }}
                      className={`shrink-0 px-2.5 xl:px-3 py-2 rounded-lg text-[11px] font-sans font-bold tracking-wider uppercase transition-all cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? "bg-[#111] text-[#FAF9F6] shadow-xs"
                          : "hover:bg-black/5 text-[#2e2c29]"
                      }`}
                    >
                      {label}
                    </a>
                  );
                })}
              </nav>

              {/* Actions on Desktop Only */}
              <div className="hidden xl:flex pointer-events-auto items-center justify-end gap-2.5 shrink-0">
                {/* Custom Synthesizer Toggle */}
                <button
                  onClick={toggleAudio}
                  title={audioEnabled ? "Ambient sound on — click to mute" : "Ambient sound off — click to play"}
                  aria-label={audioEnabled ? "Mute ambient sound" : "Play ambient sound"}
                  className={`hud-interactive px-3 py-2.5 2xl:px-4 md:py-3 rounded-xl backdrop-blur-md border border-black/5 flex items-center gap-2 text-[11px] font-sans font-bold tracking-wider uppercase whitespace-nowrap transition-all shadow-sm cursor-pointer ${
                    audioEnabled
                      ? "bg-champagne/15 border border-champagne text-[#111]"
                      : "bg-white/60 hover:bg-white text-[#666]"
                  }`}
                  id="toggle-synth-audio-btn"
                >
                  {audioEnabled ? (
                    <>
                      <Volume2 className="w-4 h-4 text-champagne animate-bounce" />
                      <span className="hidden 2xl:inline">Sound on</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4 text-[#888]" />
                      <span className="hidden 2xl:inline">Sound off</span>
                    </>
                  )}
                </button>

                {/* FSIA Portal Button */}
                <a
                  href="https://www.fsia.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="FSIA Portal (fsia.in)"
                  className="hud-interactive px-3 py-2.5 xl:px-4 md:py-3 rounded-xl backdrop-blur-md border border-black/10 flex items-center justify-center gap-1.5 text-[#111] bg-white hover:bg-stone-50 transition-all shadow-sm cursor-pointer text-[11px] font-sans font-bold tracking-wider uppercase whitespace-nowrap"
                >
                  <ExternalLink className="w-4 h-4 xl:hidden" aria-hidden="true" />
                  <span className="hidden xl:inline">FSIA Portal</span>
                  <span className="sr-only xl:hidden">FSIA Portal</span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>

                {/* VIP Collaboration Gateway Trigger */}
                <button
                  onClick={() => setIsCollaborationOpen(true)}
                  className="hud-interactive bg-[#111] hover:bg-[#222] text-[#FAF9F6] font-sans text-[11px] tracking-[0.1em] font-bold px-4 py-2.5 xl:px-5 md:py-3 rounded-xl shadow-md cursor-pointer flex items-center gap-2 uppercase whitespace-nowrap active:scale-95"
                  id="open-collaboration-form-btn"
                >
                  <FileText className="w-4 h-4 text-champagne" aria-hidden="true" />
                  Brand Enquiry
                </button>
              </div>
            </header>

            {/* 2. LEFT PANEL: EDITORIAL INDEX SELECTOR */}
            {activeTab === "catwalk" && (
              <nav aria-label="Runway categories" className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-6 z-10 pointer-events-none max-h-[80vh] overflow-y-auto scrollbar-none">
                <div className="hud-interactive bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-black/5 shadow-sm flex flex-col gap-5 pointer-events-auto pb-8">
                  <span className="block text-[11px] font-sans tracking-[0.3em] text-[#8E8D8A] uppercase font-bold border-b border-black/5 pb-2">
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
                        aria-current={isActive ? "true" : undefined}
                        className="group flex items-center gap-4 text-left cursor-pointer"
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
                            className={`block text-[11px] font-mono tracking-wider transition-colors ${
                              isActive ? "text-champagne font-bold" : "text-[#57554f]"
                            }`}
                          >
                            0{idx + 1}
                          </span>
                          <span
                            className={`block font-serif-text text-sm transition-colors leading-none mt-0.5 ${
                              isActive
                                ? "text-[#111] font-bold"
                                : "text-[#2e2c29] group-hover:text-[#111]"
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
                <div className="pointer-events-auto bg-white/85 backdrop-blur-md pl-3 pr-8 py-1.5 rounded-xl border border-black/10 shadow-xs flex gap-2 overflow-x-auto scrollbar-none max-w-full items-center" role="group" aria-label="Runway categories">
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
                        aria-pressed={isActive}
                        className={`flex-shrink-0 px-3 py-2 rounded-lg text-[11px] font-sans font-bold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                          isActive
                            ? "bg-[#111] text-[#FAF9F6] shadow-2xs"
                            : "bg-white/60 hover:bg-white text-[#2e2c29]"
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
                <div className="hud-interactive bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-black/5 shadow-sm flex flex-col gap-4 pointer-events-auto w-64">
                  <span className="block text-[11px] font-sans tracking-[0.3em] text-[#8E8D8A] uppercase font-bold border-b border-black/5 pb-2">
                    VIP ROSTER METRICS
                  </span>

                  <div className="space-y-3">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-sans text-[#888] uppercase tracking-wider block">
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
                      <span className="text-[11px] font-sans text-[#888] uppercase tracking-wider block">
                        Escrow Safeguard
                      </span>
                      <span className="font-serif-text text-sm text-[#222] font-semibold flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-champagne inline" />
                        100% Secure Audited Contracts
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[11px] font-sans text-[#888] uppercase tracking-wider block">
                        Verification Block
                      </span>
                      <span className="font-mono text-[11px] text-[#555] bg-black/5 px-2 py-0.5 rounded">
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
                  <div className="bg-white/90 backdrop-blur-md border border-black/5 shadow-sm px-4 py-2 md:px-5 md:py-2.5 rounded-full flex items-center gap-2 text-[11px] font-sans font-semibold text-[#2e2c29] tracking-widest uppercase animate-bounce pointer-events-auto">
                    <Compass className="w-4 h-4 text-champagne animate-spin-slow" />
                    <span className="hidden xs:inline">Scroll / Wheel Drag to</span> Glide Catwalk
                  </div>
                )}

                {/* Catwalk controls container */}
                <div className="hud-interactive w-full max-w-4xl bg-white/90 backdrop-blur-md px-4 py-3 md:px-6 md:py-4 rounded-2xl border border-black/5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4 pointer-events-auto">
                  {/* Arrow navigation triggers */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                    <button
                      onClick={handlePrevSection}
                      disabled={activeSectionIndex === 0}
                      aria-label="Previous runway category"
                      className="w-11 h-11 rounded-full bg-white hover:bg-[#F3F3F1] border border-black/15 flex items-center justify-center text-[#111] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex-shrink-0"
                      id="prev-section-btn"
                    >
                      <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                    </button>
                    <div className="text-center sm:text-left min-w-[140px] md:min-w-[200px]" aria-live="polite">
                      <span className="block text-[11px] font-mono text-[#888] uppercase tracking-widest">
                        ACTIVE SECTION — {activeSectionIndex + 1} / {sections.length}
                      </span>
                      <span className="block font-serif-display text-xs md:text-sm font-bold text-[#111] truncate max-w-[180px] md:max-w-none">
                        {activeSection.title}
                      </span>
                    </div>
                    <button
                      onClick={handleNextSection}
                      disabled={activeSectionIndex === sections.length - 1}
                      aria-label="Next runway category"
                      className="w-11 h-11 rounded-full bg-white hover:bg-[#F3F3F1] border border-black/15 flex items-center justify-center text-[#111] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex-shrink-0"
                      id="next-section-btn"
                    >
                      <ChevronRight className="w-5 h-5" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Elegant Runway Catwalk Progress Slider */}
                  <div className="hidden sm:block flex-1 max-w-sm w-full space-y-1">
                    <div className="flex justify-between text-[11px] font-sans text-[#888] tracking-widest uppercase font-bold">
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
                <motion.main
                  key={activeTab}
                  id="main-content"
                  tabIndex={-1}
                  ref={contentScrollRef}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute inset-0 top-[108px] sm:top-[138px] md:top-[146px] xl:top-[124px] bottom-0 overflow-y-auto px-4 md:px-8 pb-28 lg:pb-8 z-15 pointer-events-auto bg-[#FAF9F6] scrollbar-thin scrollbar-thumb-black/10 outline-none"
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
                  {activeTab === "admin" && (
                    <Suspense fallback={<p className="py-24 text-center text-sm text-[#47453f]" role="status">Loading the admin workspace…</p>}>
                      <AdminTab />
                    </Suspense>
                  )}
                  {activeTab !== "admin" && (
                    <SiteFooter
                      footerText={settings.footerText}
                      onNavigate={navigateTo}
                      onBrandEnquiry={() => setIsCollaborationOpen(true)}
                      onBackToTop={() => contentScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
                    />
                  )}
                </motion.main>
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
                  moodboardItems={moodboardItems}
                />
              )}
            </AnimatePresence>

            {/* --- SECURE COLLABORATION GATEWAY MODAL DRAWER --- */}
            <VipCollaborationForm
              isOpen={isCollaborationOpen}
              onClose={() => setIsCollaborationOpen(false)}
              preselectedCreator={selectedCreator}
            />

            {/* --- MOODBOARD MODAL --- */}
            <MoodboardModal
              isOpen={isMoodboardOpen}
              onClose={() => setIsMoodboardOpen(false)}
              items={moodboardItems}
              onRemoveItem={(url) => setMoodboardItems(prev => prev.filter(u => u !== url))}
              onClearAll={() => setMoodboardItems([])}
            />

            {/* --- MOBILE BOTTOM NAVIGATION (the header tabs stay available for FAQs) --- */}
            <nav
              aria-label="Quick links"
              className="surface-dark fixed bottom-4 inset-x-4 h-16 bg-[#111]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center justify-around px-2 z-50 lg:hidden pointer-events-auto"
            >
              {MOBILE_NAV.map((item) => {
                const isSelected = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <a
                    key={item.id}
                    href={routeForTab(item.id).path}
                    aria-current={isSelected ? "page" : undefined}
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                      e.preventDefault();
                      navigateTo(item.id);
                      playCrystalChime();
                    }}
                    className="flex flex-col items-center justify-center flex-1 h-full relative cursor-pointer group rounded-xl"
                  >
                    <span className={`p-1 rounded-xl transition-all duration-300 ${isSelected ? "text-champagne scale-110" : "text-[#cfcac0] group-hover:text-white"}`}>
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <span className={`text-[11px] font-sans font-bold tracking-wide uppercase transition-colors duration-300 ${isSelected ? "text-champagne" : "text-[#cfcac0]"}`}>
                      {item.label}
                    </span>
                    {isSelected && (
                      <motion.span
                        layoutId="activeMobileTabDot"
                        className="absolute bottom-1 w-1 h-1 rounded-full bg-champagne"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </a>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
