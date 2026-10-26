import React, { useState, useRef, useEffect, useMemo, lazy, Suspense, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Compass, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
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
import HomeTab from "./components/HomeTab";
import StarIndiaTab from "./components/StarIndiaTab";
import GreenLightTab from "./components/GreenLightTab";
import ContactTab from "./components/ContactTab";
import type { RosterStatus } from "./components/RosterNotice";
import { Toaster } from "react-hot-toast";
import { TabId, routeForPath, routeForTab, applyRouteMeta } from "./seo";
import { BRAND_NAME } from "./content/brand";
import { readableAccent } from "./lib/color";
import { ProfileView, profilesFromSections } from "./lib/profile";
import { PROFILE_PARAM, profileSlugFromLocation } from "./lib/profileLink";
import { useDialog } from "./lib/dialog";

// The 3D scene (Three.js) and the admin workspace are loaded on demand, so the
// home page and content pages don't wait for code most visitors never run
const ThreeGallery = lazy(() => import("./components/ThreeGallery"));
const AdminTab = lazy(() => import("./components/AdminTab"));

// Main navigation: what people come for, in plain words. The 3D gallery and contact
// page are linked from the home page, the menu and the footer.
const NAV: { id: TabId; label: string }[] = [
  { id: "directory", label: "Profiles" },
  { id: "starindia", label: "Star India" },
  { id: "campaigns", label: "Campaigns" },
  { id: "membership", label: "Membership" },
  { id: "greenlight", label: "Magazine" },
  { id: "faq", label: "FAQ" }
];
const MENU_EXTRA: { id: TabId; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "catwalk", label: "3D gallery" },
  { id: "contact", label: "Contact" }
];

function Wordmark({ onHome }: { onHome: () => void }) {
  return (
    <a
      href="/"
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        onHome();
      }}
      aria-label={`${BRAND_NAME}, home`}
      className="flex items-center gap-2.5 shrink-0"
    >
      <img src="/favicon.svg" alt="" width={28} height={28} className="w-7 h-7 rounded-[6px]" />
      <span className="font-display text-[1.25rem] leading-none tracking-[-0.01em] text-ink whitespace-nowrap">{BRAND_NAME}</span>
    </a>
  );
}

export default function App() {
  const initialTab = routeForPath(window.location.pathname).tab;
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [selectedSlug, setSelectedSlug] = useState<string>(() => profileSlugFromLocation());
  const [isCollaborationOpen, setIsCollaborationOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactTopic, setContactTopic] = useState("");
  // Three.js loads the first time someone opens the 3D gallery, not on every page
  const [galleryMounted, setGalleryMounted] = useState(initialTab === "catwalk");
  useEffect(() => {
    if (activeTab === "catwalk") setGalleryMounted(true);
  }, [activeTab]);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [moodboardItems, setMoodboardItems] = useState<string[]>([]);
  const [isMoodboardOpen, setIsMoodboardOpen] = useState(false);

  // Published profiles. The built-in sample list is used only if the API cannot be reached,
  // and pages say so when that happens.
  const [sections, setSections] = useState<any[]>([]);
  const [rosterStatus, setRosterStatus] = useState<RosterStatus>("loading");
  const profiles = useMemo(() => profilesFromSections(sections), [sections]);
  const selectedProfile = useMemo(() => profiles.find((p) => p.slug === selectedSlug) || null, [profiles, selectedSlug]);

  const [settings, setSettings] = useState<any>({
    footerText: `© ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.`,
    primaryColor: "#E1C699"
  });

  const refreshSections = useCallback(() => {
    fetch("/api/creators")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error();
        setSections(data);
        setRosterStatus("live");
      })
      .catch(() => {
        setSections(gallerySections);
        setRosterStatus("sample");
      });
  }, []);

  useEffect(() => {
    refreshSections();
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (data && typeof data === "object") setSettings((s: any) => ({ ...s, ...data }));
      })
      .catch(() => {});
  }, [refreshSections]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("fsia_moodboard");
      if (saved) setMoodboardItems(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem("fsia_moodboard", JSON.stringify(moodboardItems));
    } catch {}
  }, [moodboardItems]);

  useEffect(() => {
    window.addEventListener("sections-updated", refreshSections);
    const handleTabChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) navigateTo(detail);
    };
    const handleToggleMoodboard = (e: Event) => {
      const url = (e as CustomEvent).detail;
      setMoodboardItems((prev) => (prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]));
    };
    const handleOpenMoodboard = () => setIsMoodboardOpen(true);
    const handleOpenVIP = () => setIsCollaborationOpen(true);
    window.addEventListener("change-tab", handleTabChange);
    window.addEventListener("toggle-moodboard", handleToggleMoodboard);
    window.addEventListener("open-moodboard", handleOpenMoodboard);
    window.addEventListener("open-vip-collaboration", handleOpenVIP);
    return () => {
      window.removeEventListener("sections-updated", refreshSections);
      window.removeEventListener("change-tab", handleTabChange);
      window.removeEventListener("toggle-moodboard", handleToggleMoodboard);
      window.removeEventListener("open-moodboard", handleOpenMoodboard);
      window.removeEventListener("open-vip-collaboration", handleOpenVIP);
    };
  }, [refreshSections]);

  // Keep the address bar and <head> (title, description, canonical, OG) in sync with the section
  useEffect(() => {
    const route = routeForTab(activeTab);
    applyRouteMeta(route);
    if (window.location.pathname !== route.path) {
      window.history.pushState({ tab: activeTab }, "", route.path);
    }
    contentScrollRef.current?.scrollTo({ top: 0 });
  }, [activeTab]);

  useEffect(() => {
    const onPopState = () => {
      setActiveTab(routeForPath(window.location.pathname).tab);
      setSelectedSlug(profileSlugFromLocation());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // A profile someone linked to that no longer exists: drop the parameter quietly
  useEffect(() => {
    if (rosterStatus !== "loading" && selectedSlug && !selectedProfile) closeProfile();
  }, [rosterStatus, selectedSlug, selectedProfile]);

  // While a profile is open, its own title is shown in the browser tab
  useEffect(() => {
    if (!selectedProfile) {
      applyRouteMeta(routeForTab(activeTab));
      return;
    }
    document.title = `${selectedProfile.name}${selectedProfile.role ? `, ${selectedProfile.role}` : ""} | ${BRAND_NAME}`;
  }, [selectedProfile, activeTab]);

  const navigateTo = (tab: TabId) => {
    setActiveTab(tab);
    setSelectedSlug("");
    setMenuOpen(false);
  };

  // Profiles open over the current page and get their own address (?profile=…), so the
  // browser's Back button closes them and the link can be shared
  const openProfile = (profile: ProfileView) => {
    setSelectedSlug(profile.slug);
    if (activeTab === "catwalk") return;
    window.history.pushState({ tab: activeTab, profile: profile.slug }, "", `${window.location.pathname}?${mergeParam(PROFILE_PARAM, profile.slug)}`);
  };

  const closeProfile = () => {
    setSelectedSlug("");
    const params = new URLSearchParams(window.location.search);
    if (!params.has(PROFILE_PARAM)) return;
    if (window.history.state?.profile) {
      window.history.back();
      return;
    }
    params.delete(PROFILE_PARAM);
    const qs = params.toString();
    window.history.replaceState(window.history.state, "", window.location.pathname + (qs ? `?${qs}` : ""));
  };

  const browse = (filters: { q?: string; category?: string; city?: string }) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    const qs = params.toString();
    window.history.pushState({ tab: "directory" }, "", "/talent/" + (qs ? `?${qs}` : ""));
    // Remount the directory so it reads the new filters from the address bar
    setDirectoryKey((k) => k + 1);
    navigateTo("directory");
  };
  const [directoryKey, setDirectoryKey] = useState(0);

  const askAboutAward = () => {
    setContactTopic("Awards & applications");
    navigateTo("contact");
  };

  const reportProfile = () => {
    const name = selectedProfile?.name || "";
    setContactTopic(name ? `Profile correction or removal|${name}` : "Profile correction or removal");
    navigateTo("contact");
  };

  const menuRef = useDialog<HTMLDivElement>(menuOpen, () => setMenuOpen(false));

  // The gallery works with the raw creator records
  const galleryCreator: Creator | null = activeTab === "catwalk" ? selectedProfile?.creator ?? null : null;
  // Stable callback: the 3D scene rebuilds whenever its callbacks change
  const profilesRef = useRef(profiles);
  profilesRef.current = profiles;
  const selectFromGallery = useCallback((creator: Creator | null) => {
    if (!creator) {
      setSelectedSlug("");
      return;
    }
    const match = profilesRef.current.find((p) => p.creator === creator || p.name === creator.name);
    if (match) setSelectedSlug(match.slug);
  }, []);

  const activeSection = sections[activeSectionIndex] || sections[0] || { id: "none", title: "", creators: [] };

  const navLinkClass = (tab: TabId) =>
    `relative inline-flex items-center h-16 px-1 text-[0.9375rem] transition-colors ${
      activeTab === tab ? "text-ink font-semibold after:absolute after:inset-x-1 after:bottom-0 after:h-[2px] after:bg-ink" : "text-ink-2 hover:text-ink"
    }`;

  return (
    <div
      className="relative w-screen h-[100dvh] overflow-hidden bg-paper font-sans text-ink"
      style={{ ["--color-champagne" as any]: readableAccent(settings.primaryColor) }}
    >
      <Toaster position="top-right" reverseOrder={false} toastOptions={{ duration: 4000 }} />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:bg-ink focus:text-white focus:px-4 focus:py-2.5 focus:rounded-[4px] focus:text-sm focus:font-semibold"
      >
        Skip to main content
      </a>

      {/* The 3D gallery (main content on /gallery/) */}
      <div
        className="absolute inset-0 top-16 w-full z-0"
        role={activeTab === "catwalk" ? "main" : undefined}
        id={activeTab === "catwalk" ? "main-content" : undefined}
        tabIndex={activeTab === "catwalk" ? -1 : undefined}
        aria-hidden={activeTab !== "catwalk" || undefined}
      >
        {activeTab === "catwalk" && <h1 className="sr-only">{routeForTab("catwalk").heading}</h1>}
        {galleryMounted && sections.length > 0 && (
          <Suspense fallback={null}>
            <ThreeGallery
              paused={activeTab !== "catwalk"}
              sections={sections}
              activeSectionIndex={activeSectionIndex}
              selectedCreator={galleryCreator}
              onSelectCreator={selectFromGallery}
              onSectionChange={setActiveSectionIndex}
            />
          </Suspense>
        )}
        <CursorParticleTrail active={activeTab === "catwalk"} color={readableAccent(settings.primaryColor)} />
      </div>

      {/* Header */}
      <header className="absolute top-0 inset-x-0 z-30 h-16 bg-paper/95 backdrop-blur border-b border-line">
        <div className="page h-full flex items-center justify-between gap-6">
          <Wordmark onHome={() => navigateTo("home")} />

          <nav aria-label="Main" id="main-nav-tabs" className="hidden lg:flex items-center gap-6 h-full">
            {NAV.map(({ id, label }) => (
              <a
                key={id}
                href={routeForTab(id).path}
                aria-current={activeTab === id ? "page" : undefined}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                  e.preventDefault();
                  navigateTo(id);
                }}
                className={navLinkClass(id)}
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setIsCollaborationOpen(true)} className="hidden md:inline-flex btn btn-sm btn-secondary" id="open-collaboration-form-btn">
              Brand enquiry
            </button>
            <a
              href={routeForTab("apply").path}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                e.preventDefault();
                navigateTo("apply");
              }}
              aria-current={activeTab === "apply" ? "page" : undefined}
              className="hidden sm:inline-flex btn btn-sm btn-primary"
            >
              Join as a creator
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              className="lg:hidden inline-flex items-center gap-2 h-10 px-3 rounded-[4px] border border-line-strong text-ink text-[0.9375rem] font-semibold cursor-pointer"
            >
              <Menu className="w-5 h-5" aria-hidden="true" /> Menu
            </button>
          </div>
        </div>
      </header>

      {/* Menu for phones and tablets */}
      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden" onClick={() => setMenuOpen(false)}>
            <div className="absolute inset-0 bg-ink/30" aria-hidden="true" />
            <motion.div
              ref={menuRef}
              id="site-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-x-0 top-0 bg-paper border-b border-line shadow-[0_12px_30px_-12px_rgba(27,26,23,0.3)] outline-none max-h-[100dvh] overflow-y-auto"
            >
              <div className="page h-16 flex items-center justify-between">
                <Wordmark onHome={() => navigateTo("home")} />
                <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="w-10 h-10 inline-flex items-center justify-center rounded-[4px] text-ink hover:bg-sunken cursor-pointer">
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
              <nav aria-label="Menu" className="page pb-6">
                <ul className="divide-y divide-line border-y border-line">
                  {[...MENU_EXTRA.slice(0, 1), ...NAV, ...MENU_EXTRA.slice(1)].map(({ id, label }) => (
                    <li key={id}>
                      <a
                        href={routeForTab(id).path}
                        aria-current={activeTab === id ? "page" : undefined}
                        onClick={(e) => {
                          if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                          e.preventDefault();
                          navigateTo(id);
                        }}
                        className={`flex items-center justify-between py-3.5 text-[1.0625rem] ${activeTab === id ? "font-semibold text-ink" : "text-ink-2"}`}
                      >
                        {label}
                        {activeTab === id && <span className="text-[0.8125rem] text-ink-3 font-normal">Current page</span>}
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <a
                    href={routeForTab("apply").path}
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                      e.preventDefault();
                      navigateTo("apply");
                    }}
                    className="btn btn-primary"
                  >
                    Join as a creator
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setIsCollaborationOpen(true);
                    }}
                    className="btn btn-secondary"
                  >
                    Brand enquiry
                  </button>
                </div>
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3D gallery controls */}
      {activeTab === "catwalk" && sections.length > 0 && (
        <>
          <nav aria-label="Gallery sections" className="absolute left-6 top-1/2 -translate-y-1/2 hidden lg:block z-10 max-h-[70vh] overflow-y-auto scrollbar-none">
            <div className="bg-paper/95 border border-line p-5 w-56 space-y-1">
              <p className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-ink-3 pb-2 mb-1 border-b border-line">Sections</p>
              {sections.map((sec, idx) => (
                <button
                  key={`${sec.id}-${idx}`}
                  type="button"
                  onClick={() => {
                    setActiveSectionIndex(idx);
                    closeProfile();
                  }}
                  aria-current={idx === activeSectionIndex ? "true" : undefined}
                  className={`block w-full text-left py-1.5 text-[0.9375rem] cursor-pointer ${idx === activeSectionIndex ? "font-semibold text-ink" : "text-ink-2 hover:text-ink"}`}
                >
                  {sec.title}
                </button>
              ))}
            </div>
          </nav>

          <div className="absolute bottom-0 inset-x-0 p-4 md:p-6 flex justify-center z-10 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-xl bg-paper/95 border border-line px-4 py-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveSectionIndex(Math.max(0, activeSectionIndex - 1))}
                disabled={activeSectionIndex === 0}
                aria-label="Previous section"
                id="prev-section-btn"
                className="w-10 h-10 inline-flex items-center justify-center border border-line-strong rounded-[4px] text-ink disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>
              <div className="text-center min-w-0" aria-live="polite">
                <span className="block text-[0.75rem] text-ink-3 tabular-nums">Section {activeSectionIndex + 1} of {sections.length}</span>
                <span className="block font-semibold text-ink truncate">{activeSection.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveSectionIndex(Math.min(sections.length - 1, activeSectionIndex + 1))}
                disabled={activeSectionIndex === sections.length - 1}
                aria-label="Next section"
                id="next-section-btn"
                className="w-10 h-10 inline-flex items-center justify-center border border-line-strong rounded-[4px] text-ink disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {!selectedProfile && (
            <p className="absolute top-20 inset-x-0 mx-auto w-fit z-10 bg-paper/95 border border-line px-3 py-1.5 text-[0.8125rem] text-ink-2 flex items-center gap-2 pointer-events-none">
              <Compass className="w-4 h-4" aria-hidden="true" /> Scroll or drag to move; select a portrait to open the profile
            </p>
          )}
        </>
      )}

      {/* Content pages */}
      <AnimatePresence mode="wait" initial={false}>
        {activeTab !== "catwalk" && (
          <motion.main
            key={activeTab}
            id="main-content"
            tabIndex={-1}
            ref={contentScrollRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute inset-0 top-16 overflow-y-auto z-[15] bg-paper outline-none"
          >
            {activeTab === "home" && (
              <HomeTab
                profiles={profiles}
                status={rosterStatus}
                onNavigate={navigateTo}
                onSelectProfile={openProfile}
                onBrandEnquiry={() => setIsCollaborationOpen(true)}
                onAwardEnquiry={askAboutAward}
                onBrowse={browse}
                onRetry={refreshSections}
              />
            )}
            {activeTab === "directory" && (
              <DirectoryTab
                key={directoryKey}
                profiles={profiles}
                status={rosterStatus}
                onSelectProfile={openProfile}
                onApply={() => navigateTo("apply")}
                onRetry={refreshSections}
              />
            )}
            {activeTab === "starindia" && (
              <StarIndiaTab profiles={profiles} status={rosterStatus} onNavigate={navigateTo} onSelectProfile={openProfile} onRetry={refreshSections} />
            )}
            {activeTab === "greenlight" && <GreenLightTab coverCreator={profiles.find((p) => p.image)?.creator} />}
            {activeTab === "contact" && <ContactTab key={contactTopic} onNavigate={navigateTo} initialTopic={contactTopic} />}
            {activeTab === "campaigns" && <CampaignsTab />}
            {activeTab === "membership" && <MembershipTab />}
            {activeTab === "apply" && <ModelRegistrationTab />}
            {activeTab === "faq" && <FaqTab onNavigate={navigateTo} />}
            {activeTab === "admin" && (
              <Suspense fallback={<p className="py-24 text-center text-sm text-ink-2" role="status">Loading the admin workspace…</p>}>
                <AdminTab />
              </Suspense>
            )}
            {activeTab !== "admin" && (
              <SiteFooter footerText={settings.footerText} onNavigate={navigateTo} onBrandEnquiry={() => setIsCollaborationOpen(true)} />
            )}
          </motion.main>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedProfile && (
          <CreatorDetailPanel
            key={selectedProfile.slug}
            profile={selectedProfile}
            onClose={closeProfile}
            onOpenCollaboration={() => setIsCollaborationOpen(true)}
            onReport={reportProfile}
            moodboardItems={moodboardItems}
          />
        )}
      </AnimatePresence>

      <VipCollaborationForm
        isOpen={isCollaborationOpen}
        onClose={() => setIsCollaborationOpen(false)}
        preselectedCreator={selectedProfile?.creator ?? null}
      />

      <MoodboardModal
        isOpen={isMoodboardOpen}
        onClose={() => setIsMoodboardOpen(false)}
        items={moodboardItems}
        onRemoveItem={(url) => setMoodboardItems((prev) => prev.filter((u) => u !== url))}
        onClearAll={() => setMoodboardItems([])}
      />
    </div>
  );
}

function mergeParam(key: string, value: string) {
  const params = new URLSearchParams(window.location.search);
  params.set(key, value);
  return params.toString();
}
