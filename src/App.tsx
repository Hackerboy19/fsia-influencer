import { safeSession } from "./lib/safeStorage";
import React, { useState, useRef, useEffect, useMemo, lazy, Suspense, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Compass, ChevronLeft, ChevronRight } from "lucide-react";
import { gallerySections, Creator } from "./data";
import CreatorDetailPanel from "./components/CreatorDetailPanel";
import VipCollaborationForm from "./components/VipCollaborationForm";
import MoodboardModal from "./components/MoodboardModal";
import DirectoryTab from "./components/DirectoryTab";
import CampaignsTab from "./components/CampaignsTab";
import MembershipTab from "./components/MembershipTab";
import ModelRegistrationTab from "./components/ModelRegistrationTab";
import FaqTab from "./components/FaqTab";
import SiteFooter from "./components/SiteFooter";
import HomeTab from "./components/HomeTab";
import SiteHeader, { NavTarget } from "./components/SiteHeader";
import StarIndiaTab from "./components/StarIndiaTab";
import GreenLightTab from "./components/GreenLightTab";
import ContactTab from "./components/ContactTab";
import PrivacyTab from "./components/PrivacyTab";
import { AwardsTab, CategoriesTab, ForBrandsTab, ForCreatorsTab } from "./components/InfoPages";
import type { RosterStatus } from "./components/RosterNotice";
import { Toaster } from "react-hot-toast";
import { TabId, routeForPath, routeForTab, applyRouteMeta, setPageOverrides, isHiddenTab } from "./seo";
import { watchHeadingOverrides } from "./lib/headingOverrides";
import { setContentOverrides, hasContentOverrides, watchContent } from "./lib/contentOverrides";
import { startContentEditing } from "./lib/contentEditMode";
import { setHomeHero, setNavLabels } from "./lib/siteContent";
import { BRAND_NAME } from "./content/brand";
import { readableAccent } from "./lib/color";
import { ProfileView, profilesFromSections } from "./lib/profile";
import { PROFILE_PARAM, profileSlugFromLocation } from "./lib/profileLink";

// The 3D scene (Three.js) and the admin workspace are loaded on demand, so the
// home page and content pages don't wait for code most visitors never run
const ThreeGallery = lazy(() => import("./components/ThreeGallery"));
const AdminTab = lazy(() => import("./components/AdminTab"));

export default function App() {
  const initialTab = routeForPath(window.location.pathname).tab;
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [selectedSlug, setSelectedSlug] = useState<string>(() => profileSlugFromLocation());
  const [isCollaborationOpen, setIsCollaborationOpen] = useState(false);
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
  const categories = useMemo(() => {
    const m = new Map<string, number>();
    profiles.forEach((p) => p.category && m.set(p.category, (m.get(p.category) || 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [profiles]);
  const selectedProfile = useMemo(() => profiles.find((p) => p.slug === selectedSlug) || null, [profiles, selectedSlug]);

  const [settings, setSettings] = useState<any>({
    footerText: `© ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.`,
    primaryColor: "#E1C699"
  });

  // Admin → Pages & SEO → Preview: the page opens in a frame and receives the unsaved
  // changes from the admin panel. Nothing is saved; a reload shows the live site again.
  const previewMode = useMemo(() => {
    if (typeof window === "undefined" || window.parent === window) return false;
    const q = new URLSearchParams(window.location.search);
    return q.has("fsia-preview") || q.has("fsia-edit");
  }, []);
  const editMode = useMemo(() => previewMode && new URLSearchParams(window.location.search).has("fsia-edit"), [previewMode]);
  const previewData = useRef<any>(null);
  const applyPreview = useCallback((d: any) => {
    setPageOverrides(d.pages);
    setHomeHero(d.homeHero);
    setNavLabels(d.navLabels);
    if (d.content !== undefined) setContentOverrides(d.content);
    setSettings((s: any) => ({ ...s, pages: d.pages, homeHero: d.homeHero, navLabels: d.navLabels, previewAt: Date.now() }));
  }, []);
  useEffect(() => {
    if (!previewMode) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      if (!e.data || e.data.type !== "fsia-preview") return;
      previewData.current = e.data;
      applyPreview(e.data);
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "fsia-preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, [previewMode, applyPreview]);

  const refreshSections = useCallback(() => {
    // Never leave pages on "Loading profiles…": give up after 12 seconds and say so
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 12000);
    fetch("/api/creators", { signal: controller.signal })
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
      })
      .finally(() => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    refreshSections();
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (data && typeof data === "object") {
          // Page text, SEO and share-card overrides saved in Admin → Pages & SEO
          setPageOverrides(data.pages);
          setHomeHero(data.homeHero); setNavLabels(data.navLabels);
          setContentOverrides(data.content);
          setSettings((s: any) => ({ ...s, ...data }));
          if (previewData.current) applyPreview(previewData.current);
        }
      })
      .catch(() => {});
  }, [refreshSections, applyPreview]);

  useEffect(() => {
    try {
      const saved = safeSession.getItem("fsia_moodboard");
      if (saved) setMoodboardItems(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      safeSession.setItem("fsia_moodboard", JSON.stringify(moodboardItems));
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

  // Admin → Page content: replaced texts and images, kept in place while the page redraws
  useEffect(() => {
    if (activeTab === "admin" || (!previewMode && !hasContentOverrides())) return;
    const path = routeForTab(activeTab).path;
    return watchContent(() => document.body, path);
  }, [activeTab, settings, previewMode]);

  // Inside Admin → Page content: clicking a text or an image picks it for editing
  useEffect(() => {
    if (!editMode) return;
    return startContentEditing(() => routeForTab(activeTabRef.current).path);
  }, [editMode]);

  // Admin heading replacements (Pages & SEO → H2 / H3) for the open page
  useEffect(() => {
    if (activeTab === "admin") return;
    const route = routeForTab(activeTab);
    const h2 = route.h2 || [];
    const h3 = route.h3 || [];
    if (![...h2, ...h3].some(Boolean)) return;
    return watchHeadingOverrides(() => document.getElementById("main-content"), h2, h3);
  }, [activeTab, settings]);

  useEffect(() => {
    const onPopState = () => {
      setActiveTab(routeForPath(window.location.pathname).tab);
      setSelectedSlug(profileSlugFromLocation());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Arriving on a link to a section (e.g. /#the-award): scroll to it once the page is drawn
  const initialHash = useRef(typeof window !== "undefined" ? window.location.hash.slice(1) : "");
  useEffect(() => {
    if (rosterStatus === "loading" || !initialHash.current) return;
    scrollToHash(initialHash.current, false);
    initialHash.current = "";
  }, [rosterStatus]);

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
  }, [selectedProfile, activeTab, settings]);

  const navigateTo = (tab: TabId) => {
    setActiveTab(tab);
    setSelectedSlug("");
  };

  // Go to a page, or to a section on a page (/#the-award). The section is scrolled into
  // view once the page has rendered.
  const scrollToHash = (hash: string, smooth = true) => {
    let tries = 0;
    const attempt = () => {
      const el = document.getElementById(hash);
      if (el) {
        // A guide link opens that guide
        if (el instanceof HTMLDetailsElement) el.open = true;
        el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
      }
      else if (tries++ < 20) window.setTimeout(attempt, 60);
    };
    window.setTimeout(attempt, 60);
  };
  const goTo = (t: NavTarget) => {
    if (t.tab !== activeTab || selectedSlug) navigateTo(t.tab);
    if (!t.hash) return;
    window.setTimeout(() => {
      window.history.replaceState(window.history.state, "", routeForTab(t.tab).path + "#" + t.hash);
      scrollToHash(t.hash!, t.tab === activeTab);
    }, t.tab === activeTab ? 0 : 260);
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
    window.history.pushState({ tab: "directory" }, "", "/creators/" + (qs ? `?${qs}` : ""));
    // Remount the directory so it reads the new filters from the address bar
    setDirectoryKey((k) => k + 1);
    navigateTo("directory");
  };
  const [directoryKey, setDirectoryKey] = useState(0);

  const askAboutAward = () => {
    setContactTopic("Award applications");
    navigateTo("contact");
  };

  const reportProfile = () => {
    const name = selectedProfile?.name || "";
    setContactTopic(name ? `Profile correction or removal|${name}` : "Profile correction or removal");
    navigateTo("contact");
  };


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
      activeTab === tab ? "text-ink font-semibold after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-bronze" : "text-ink-2 hover:text-ink"
    }`;

  // Pages the admin hid show a short notice instead (recomputed when settings load)
  const hiddenPage = activeTab !== "admin" && isHiddenTab(activeTab);

  return (
    <div
      className="relative w-screen h-[100dvh] overflow-hidden bg-paper font-sans text-ink"
      style={{ ["--color-champagne" as any]: readableAccent(settings.primaryColor) }}
    >
      <Toaster position="top-right" reverseOrder={false} toastOptions={{ duration: 4000 }} />
      {previewMode && (
        <div role="status" data-no-content-edit className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[80] bg-ink text-paper text-[0.8125rem] font-semibold px-4 py-2 rounded-[4px] shadow-lg pointer-events-none">
          {editMode ? "Click any text or image to change it" : "Preview: these changes are not saved yet"}
        </div>
      )}

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
      </div>

      <SiteHeader
        activeTab={activeTab}
        categories={categories}
        onGo={goTo}
        onBrowse={browse}
        onBrandEnquiry={() => setIsCollaborationOpen(true)}
      />

      {/* 3D gallery controls */}
      {activeTab === "catwalk" && !hiddenPage && sections.length > 0 && (
        <>
          <nav aria-label="Gallery sections" className="absolute left-6 top-1/2 -translate-y-1/2 hidden lg:block z-10 max-h-[70vh] overflow-y-auto scrollbar-none">
            <div className="bg-white/95 border border-line shadow-sm p-5 w-56 space-y-1">
              <p className="text-[0.875rem] font-semibold text-bronze pb-2 mb-1 border-b border-line">Sections</p>
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
            <div className="pointer-events-auto w-full max-w-xl bg-white/95 border border-line shadow-sm px-4 py-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveSectionIndex(Math.max(0, activeSectionIndex - 1))}
                disabled={activeSectionIndex === 0}
                aria-label="Previous section"
                id="prev-section-btn"
                className="w-11 h-11 inline-flex items-center justify-center border border-field rounded-[4px] text-ink hover:border-ink disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
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
                className="w-11 h-11 inline-flex items-center justify-center border border-field rounded-[4px] text-ink hover:border-ink disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {!selectedProfile && (
            <p className="absolute top-20 inset-x-0 mx-auto w-fit max-w-[calc(100%-2rem)] z-10 bg-white/95 border border-line shadow-sm px-3 py-1.5 text-[0.8125rem] text-ink-2 flex items-center gap-2 pointer-events-none">
              <Compass className="w-4 h-4" aria-hidden="true" /> Scroll or drag to move; select a portrait to open the profile
            </p>
          )}
        </>
      )}

      {/* Content pages */}
      <AnimatePresence mode="wait" initial={false}>
        {(activeTab !== "catwalk" || hiddenPage) && (
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
            {!hiddenPage && activeTab === "home" && (
              <HomeTab
                profiles={profiles}
                status={rosterStatus}
                onNavigate={navigateTo}
                onGo={goTo}
                onSelectProfile={openProfile}
                onBrandEnquiry={() => setIsCollaborationOpen(true)}
                onAwardEnquiry={askAboutAward}
                onBrowse={browse}
                onRetry={refreshSections}
                moodboardItems={moodboardItems}
              />
            )}
            {!hiddenPage && activeTab === "directory" && (
              <DirectoryTab
                key={directoryKey}
                profiles={profiles}
                status={rosterStatus}
                onSelectProfile={openProfile}
                onApply={() => navigateTo("apply")}
                onRetry={refreshSections}
              />
            )}
            {!hiddenPage && activeTab === "starindia" && (
              <StarIndiaTab profiles={profiles} status={rosterStatus} onNavigate={navigateTo} onSelectProfile={openProfile} onRetry={refreshSections} />
            )}
            {!hiddenPage && activeTab === "greenlight" && <GreenLightTab coverCreator={profiles.find((p) => p.image)?.creator} />}
            {!hiddenPage && activeTab === "contact" && <ContactTab key={contactTopic} onNavigate={navigateTo} initialTopic={contactTopic} />}
            {!hiddenPage && activeTab === "campaigns" && <CampaignsTab />}
            {!hiddenPage && activeTab === "membership" && <MembershipTab />}
            {!hiddenPage && activeTab === "apply" && <ModelRegistrationTab />}
            {!hiddenPage && activeTab === "faq" && <FaqTab onNavigate={navigateTo} />}
            {!hiddenPage && activeTab === "privacy" && <PrivacyTab onNavigate={navigateTo} />}
            {!hiddenPage && activeTab === "awards" && <AwardsTab onNavigate={navigateTo} onAwardEnquiry={askAboutAward} />}
            {!hiddenPage && activeTab === "categories" && <CategoriesTab profiles={profiles} status={rosterStatus} onBrowse={browse} onNavigate={navigateTo} />}
            {!hiddenPage && activeTab === "forbrands" && <ForBrandsTab onNavigate={navigateTo} onBrandEnquiry={() => setIsCollaborationOpen(true)} onBrowse={browse} />}
            {!hiddenPage && activeTab === "forcreators" && <ForCreatorsTab onNavigate={navigateTo} />}
            {hiddenPage && (
              <div className="page pt-16 md:pt-24 pb-24 max-w-2xl space-y-4">
                <h1 className="h-page">This page is not available right now</h1>
                <p className="lede">It may come back soon. Everything else on the site is open.</p>
                <a href="/" onClick={(e) => { e.preventDefault(); navigateTo("home"); }} className="btn btn-primary">Go to the home page</a>
              </div>
            )}
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
            related={profiles.filter((p) => p.slug !== selectedProfile.slug && p.category && p.category === selectedProfile.category).slice(0, 4)}
            sample={rosterStatus === "sample"}
            onOpenProfile={openProfile}
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
