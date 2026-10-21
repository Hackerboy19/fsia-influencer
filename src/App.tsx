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
  UserPlus,
  Home,
  Star,
  Mail
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
import SiteHeader from "./components/SiteHeader";
import HomeTab from "./components/HomeTab";
import StarIndiaTab from "./components/StarIndiaTab";
import GreenLightTab from "./components/GreenLightTab";
import ContactTab from "./components/ContactTab";
import { Toaster } from "react-hot-toast";
import { TabId, routeForPath, routeForTab, applyRouteMeta } from "./seo";
import { readableAccent } from "./lib/color";

// The 3D scene (Three.js) and the admin workspace are loaded on demand, so the
// home page and content pages don't wait for code most visitors never run
const ThreeGallery = lazy(() => import("./components/ThreeGallery"));
const AdminTab = lazy(() => import("./components/AdminTab"));

const MOBILE_NAV: { id: TabId; label: string; icon: typeof Compass }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "directory", label: "Talent", icon: Users },
  { id: "starindia", label: "Star India", icon: Star },
  { id: "apply", label: "Join", icon: UserPlus },
  { id: "contact", label: "Contact", icon: Mail }
];

// Header tabs. The 3D gallery and FAQs are reached from the home page and the footer.
const HEADER_TABS: { id: TabId; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "directory", label: "Talent" },
  { id: "campaigns", label: "Campaigns" },
  { id: "starindia", label: "Star India" },
  { id: "greenlight", label: "Green Light" },
  { id: "membership", label: "Membership" },
  { id: "apply", label: "Get Verified" },
  { id: "contact", label: "Contact" }
];

export default function App() {
  // Navigation & Showcase States
  const initialTab = routeForPath(window.location.pathname).tab;
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isCollaborationOpen, setIsCollaborationOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  // Three.js loads the first time someone opens the 3D gallery, not on every page
  const [galleryMounted, setGalleryMounted] = useState(initialTab === "catwalk");
  useEffect(() => {
    if (activeTab === "catwalk") setGalleryMounted(true);
  }, [activeTab]);
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
    primaryColor: "#F59E0B",
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
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigateTo = (tab: TabId) => {
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

  const openGallerySection = (index: number) => {
    setActiveSectionIndex(index);
    navigateTo("catwalk");
  };

  const activeSection = sections[activeSectionIndex] || sections[0] || { id: "none", title: "No Category", creators: [], primaryColor: "#F59E0B" };

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
        ["--color-champagne" as any]: readableAccent(settings.primaryColor),
        scrollSnapType: "y mandatory"
      }}
    >
      <Toaster position="top-right" reverseOrder={false} toastOptions={{ duration: 4000 }} />
      {/* THE INTERACTIVE 3D WORLD AND HUD OVERLAY, with content pages on top */}
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
                className="absolute top-0 right-[15%] w-[1px] h-full bg-[#F59E0B]/25"
              />
              <motion.div 
                animate={{ y: activeSectionIndex * -35 }}
                transition={{ type: "spring", stiffness: 45, damping: 25 }}
                className="absolute top-[40%] left-0 w-full h-[1px] bg-[#F59E0B]/25"
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
              {activeTab === "catwalk" && <h1 className="sr-only">{routeForTab("catwalk").heading}</h1>}
              {galleryMounted && <Suspense fallback={null}>
                <ThreeGallery
                  paused={activeTab !== "catwalk"}
                  sections={sections}
                  activeSectionIndex={activeSectionIndex}
                  selectedCreator={selectedCreator}
                  onSelectCreator={setSelectedCreator}
                  onSectionChange={setActiveSectionIndex}
                />
              </Suspense>}
              <CursorParticleTrail active={activeTab === "catwalk"} color={readableAccent(settings.primaryColor)} />
            </div>

            {/* Refracting Crystal Prism Info Widget (Editorial Aesthetic Theme) */}
            <div className="absolute bottom-32 right-12 w-[110px] h-[110px] pointer-events-none hidden md:block z-10 opacity-75">
              <div className="absolute inset-0 rotate-45 border border-[#F59E0B]/35 backdrop-blur-sm"></div>
              <div className="absolute inset-3 rotate-[15deg] border border-[#F59E0B]/15"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-1.5 h-1.5 bg-[#F59E0B] rounded-full animate-ping"></div>
              </div>
              <div className="absolute -top-7 left-0 text-[11px] tracking-[0.4em] uppercase whitespace-nowrap rotate-90 origin-bottom-left text-[#8E8D8A] font-bold">
                REFRACTIVE INDEX: PURE
              </div>
            </div>

            {/* 1. SITE HEADER (Star India style, same as starindia.fsia.in) */}
            <SiteHeader
              tabs={HEADER_TABS}
              activeTab={activeTab}
              onTab={(tab) => {
                setActiveTab(tab);
                setSelectedCreator(null);
                playCrystalChime();
              }}
              onHome={() => {
                navigateTo("home");
                playCrystalChime();
              }}
              audioEnabled={audioEnabled}
              onToggleAudio={toggleAudio}
              onBrandEnquiry={() => setIsCollaborationOpen(true)}
            />

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
              <div className="absolute top-[148px] left-0 right-0 lg:hidden z-20 pointer-events-none flex justify-start px-4">
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
                            ? "bg-[#111] text-[#FAF8F5] shadow-2xs"
                            : "bg-white/60 hover:bg-white text-[#2e2c29]"
                        }`}
                      >
                        <span 
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: sec.primaryColor || "#F59E0B" }} 
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
                  className="absolute inset-0 top-[136px] xl:top-[112px] bottom-0 overflow-y-auto px-4 md:px-8 pb-28 lg:pb-8 z-15 pointer-events-auto bg-[#FAF8F5] scrollbar-thin scrollbar-thumb-black/10 outline-none"
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
                  {activeTab === "home" && (
                    <HomeTab
                      sections={sections}
                      onNavigate={navigateTo}
                      onSelectCreator={setSelectedCreator}
                      onOpenGallerySection={openGallerySection}
                      onBrandEnquiry={() => setIsCollaborationOpen(true)}
                    />
                  )}
                  {activeTab === "starindia" && (
                    <StarIndiaTab sections={sections} onNavigate={navigateTo} onSelectCreator={setSelectedCreator} />
                  )}
                  {activeTab === "greenlight" && <GreenLightTab coverCreator={sections[0]?.creators?.[0]} />}
                  {activeTab === "contact" && <ContactTab onNavigate={navigateTo} />}
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
    </div>
  );
}
