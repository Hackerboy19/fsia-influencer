import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Globe, FileText, Users, Search, ExternalLink, RotateCcw, Save, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  ROUTES,
  SITE_URL,
  OG_IMAGE,
  SeoConfig,
  SeoPageOverride,
  CreatorSeo,
  EMPTY_SEO,
  assignProfileSlugs,
  defaultProfileTitle,
  defaultProfileDescription,
  slugify
} from "../seo";

interface Props {
  token: string;
}

interface SectionData {
  id: string;
  title: string;
  creators: { name: string; role?: string; city?: string; bio?: string; image?: string; seo?: CreatorSeo }[];
}

type View = "site" | "pages" | "profiles";

const TITLE_IDEAL = 60;
const DESC_IDEAL = 160;

const inputClass =
  "w-full px-3.5 py-2.5 bg-white border border-black/15 rounded-lg text-sm text-[#111] focus:outline-none focus:border-[#111] focus:ring-2 focus:ring-[#E1C699]/50";
const labelClass = "flex items-center justify-between gap-2 text-xs font-bold tracking-wider text-[#2e2c29] uppercase mb-1.5";

const profileKey = (sectionId: string, name: string) => `${sectionId}::${name}`;

function Counter({ value, ideal }: { value: string; ideal: number }) {
  const n = value.length;
  const tone = n === 0 ? "text-[#57554f]" : n > ideal ? "text-amber-700" : "text-emerald-700";
  return (
    <span className={`font-mono normal-case tracking-normal ${tone}`}>
      {n}/{ideal}
      {n > ideal ? " · may be cut off in Google" : ""}
    </span>
  );
}

// How the result is likely to look in Google
function GooglePreview({ url, title, description }: { url: string; title: string; description: string }) {
  const crumbs = url.replace(/^https?:\/\//, "").replace(/\/$/, "").split("/");
  const shortTitle = title.length > 63 ? title.slice(0, 60).trimEnd() + "…" : title;
  const shortDesc = description.length > 163 ? description.slice(0, 160).trimEnd() + "…" : description;
  return (
    <div className="rounded-xl border border-black/10 bg-white p-4 font-[Arial,Helvetica,sans-serif]" aria-label="Google result preview">
      <p className="text-[11px] font-bold tracking-wider uppercase text-[#57554f] mb-2 font-sans">Google preview</p>
      <div className="flex items-center gap-2 text-[13px] text-[#202124]">
        <span className="w-6 h-6 rounded-full bg-[#111] text-[#E1C699] flex items-center justify-center text-[11px] font-bold font-serif">F</span>
        <span className="min-w-0">
          <span className="block leading-tight">FSIA Influencer</span>
          <span className="block leading-tight text-[#4d5156] truncate">{crumbs.join(" › ")}</span>
        </span>
      </div>
      <p className="mt-1.5 text-[19px] leading-snug text-[#1a0dab] break-words">{shortTitle || "—"}</p>
      <p className="mt-1 text-[14px] leading-snug text-[#4d5156] break-words">{shortDesc || "—"}</p>
    </div>
  );
}

export default function AdminSeoPanel({ token }: Props) {
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  const [view, setView] = useState<View>("site");
  const [seo, setSeo] = useState<SeoConfig>(EMPTY_SEO);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [profileEdits, setProfileEdits] = useState<Record<string, CreatorSeo>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [query, setQuery] = useState("");
  const [openProfile, setOpenProfile] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [seoRes, creatorsRes] = await Promise.all([fetch("/api/admin/seo", { headers }), fetch("/api/creators")]);
      if (seoRes.ok) {
        const data = await seoRes.json();
        setSeo({ site: data.site || {}, pages: Array.isArray(data.pages) ? {} : data.pages || {} });
      }
      if (creatorsRes.ok) {
        const data: SectionData[] = await creatorsRes.json();
        setSections(data);
        const edits: Record<string, CreatorSeo> = {};
        data.forEach((s) => s.creators.forEach((c) => (edits[profileKey(s.id, c.name)] = { ...(c.seo || {}) })));
        setProfileEdits(edits);
      }
      setDirty(false);
    } catch {
      toast.error("Could not load SEO settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Sections with the edits applied, so profile URLs and previews update live
  const liveSections = useMemo(
    () =>
      sections.map((s) => ({
        ...s,
        creators: s.creators.map((c) => ({ ...c, seo: profileEdits[profileKey(s.id, c.name)] || {} }))
      })),
    [sections, profileEdits]
  );
  const profiles = useMemo(() => assignProfileSlugs(liveSections), [liveSections]);
  const liveSeo = seo;

  const setSite = (patch: Partial<SeoConfig["site"]>) => {
    setSeo((prev) => ({ ...prev, site: { ...prev.site, ...patch } }));
    setDirty(true);
  };
  const setPage = (path: string, patch: Partial<SeoPageOverride>) => {
    setSeo((prev) => ({ ...prev, pages: { ...prev.pages, [path]: { ...(prev.pages[path] || {}), ...patch } } }));
    setDirty(true);
  };
  const resetPage = (path: string) => {
    setSeo((prev) => {
      const pages = { ...prev.pages };
      delete pages[path];
      return { ...prev, pages };
    });
    setDirty(true);
  };
  const setProfile = (key: string, patch: Partial<CreatorSeo>) => {
    setProfileEdits((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), ...patch } }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/seo", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          site: seo.site,
          pages: seo.pages,
          profiles: sections.flatMap((s) =>
            s.creators.map((c) => ({ sectionId: s.id, name: c.name, seo: profileEdits[profileKey(s.id, c.name)] || {} }))
          )
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        toast.success("SEO settings saved. Search engines will see them on their next visit.");
        window.dispatchEvent(new Event("sections-updated"));
        await load();
      } else {
        toast.error(data.error || "Could not save SEO settings.");
      }
    } catch {
      toast.error("Could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const publicRoutes = ROUTES.filter((r) => r.indexable);
  const indexingOff = seo.site.allowIndexing === false;
  const q = query.trim().toLowerCase();
  const visibleProfiles = profiles.filter(
    (p) => !q || [p.creator.name, p.creator.role, p.section.title, p.slug].some((f) => (f || "").toLowerCase().includes(q))
  );

  const tabs: { id: View; label: string; icon: typeof Globe; hint: string }[] = [
    { id: "site", label: "Whole website", icon: Globe, hint: "Name, share image, Google verification" },
    { id: "pages", label: "Pages", icon: FileText, hint: `${publicRoutes.length} pages` },
    { id: "profiles", label: "Creator profiles", icon: Users, hint: `${profiles.length} profiles` }
  ];

  if (loading) {
    return <p className="p-10 text-center text-sm text-[#47453f]">Loading SEO settings…</p>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-24">
      <div className="bg-white/80 border border-black/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif-display text-xl font-bold text-[#111]">Search engine settings</h3>
          <p className="text-sm text-[#2e2c29]">
            Control how the website, each page and every creator profile appear in Google and when shared on WhatsApp or social media.
            Leave a field empty to use the automatic text.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#111] border border-black/15 bg-white rounded-lg px-3 py-2 hover:border-[#111]">
            Sitemap <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#111] border border-black/15 bg-white rounded-lg px-3 py-2 hover:border-[#111]">
            Search Console <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {indexingOff && (
        <div role="alert" className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-900 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p><strong>Search engines are asked not to index this website.</strong> Turn "Show this website in Google" back on in Whole website when you're ready.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="tablist">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = view === t.id;
          return (
            <button key={t.id} role="tab" aria-selected={active} onClick={() => setView(t.id)}
              className={`text-left rounded-xl border px-4 py-3 cursor-pointer transition-colors ${active ? "bg-[#111] border-[#111] text-white" : "bg-white border-black/10 text-[#111] hover:border-[#111]"}`}>
              <span className="flex items-center gap-2 font-semibold text-sm"><Icon className="w-4 h-4" /> {t.label}</span>
              <span className={`block text-xs mt-0.5 ${active ? "text-[#E9E5DC]" : "text-[#47453f]"}`}>{t.hint}</span>
            </button>
          );
        })}
      </div>

      {/* ---------------- WHOLE WEBSITE ---------------- */}
      {view === "site" && (
        <div className="bg-white/80 border border-black/10 rounded-2xl p-5 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div>
              <label htmlFor="seo-site-name" className={labelClass}>Website name</label>
              <input id="seo-site-name" className={inputClass} placeholder="FSIA Influencer"
                value={seo.site.siteName || ""} onChange={(e) => setSite({ siteName: e.target.value })} />
              <p className="text-xs text-[#47453f] mt-1">Shown as the site name in Google and in social previews.</p>
            </div>
            <div>
              <label htmlFor="seo-default-image" className={labelClass}>Default share image (link)</label>
              <input id="seo-default-image" className={inputClass} placeholder={OG_IMAGE}
                value={seo.site.defaultImage || ""} onChange={(e) => setSite({ defaultImage: e.target.value })} />
              <p className="text-xs text-[#47453f] mt-1">Used when a page has no image of its own. Best size 1200 × 630 px. Must start with https://</p>
            </div>
            <div>
              <label htmlFor="seo-gsc" className={labelClass}>Google Search Console verification</label>
              <input id="seo-gsc" className={inputClass} placeholder='Paste the code or the whole <meta name="google-site-verification" …> tag'
                value={seo.site.googleVerification || ""} onChange={(e) => setSite({ googleVerification: e.target.value })} />
              <p className="text-xs text-[#47453f] mt-1">In Search Console choose URL prefix → HTML tag, paste it here, save, then click Verify.</p>
            </div>
            <label className="flex items-start gap-3 p-4 rounded-xl border border-black/10 bg-white cursor-pointer">
              <input type="checkbox" className="mt-1 w-4 h-4 accent-[#111]" checked={!indexingOff}
                onChange={(e) => setSite({ allowIndexing: e.target.checked })} />
              <span>
                <span className="block text-sm font-semibold text-[#111]">Show this website in Google</span>
                <span className="block text-xs text-[#47453f]">Turn off only while the site is not ready. It hides every page and profile from search engines.</span>
              </span>
            </label>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-bold tracking-wider uppercase text-[#2e2c29]">Share image preview</p>
            <img
              src={/^https?:\/\//i.test(seo.site.defaultImage || "") ? seo.site.defaultImage : "/og-image.png"}
              alt="Default share image"
              className="w-full aspect-[1200/630] object-cover rounded-xl border border-black/10 bg-stone-100"
              referrerPolicy="no-referrer"
            />
            <GooglePreview url={`${SITE_URL}/`} title={seo.pages["/"]?.title || ROUTES[0].title} description={seo.pages["/"]?.description || ROUTES[0].description} />
          </div>
        </div>
      )}

      {/* ---------------- PAGES ---------------- */}
      {view === "pages" && (
        <div className="space-y-4">
          {publicRoutes.map((route) => {
            const o = seo.pages[route.path] || {};
            const title = o.title || "";
            const description = o.description || "";
            const customised = Boolean(o.title || o.description || o.image || o.noindex);
            return (
              <section key={route.path} className="bg-white/80 border border-black/10 rounded-2xl p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-4 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="font-serif-display text-lg font-bold text-[#111]">{route.heading}</h4>
                      <a href={route.path} target="_blank" rel="noopener noreferrer" className="text-sm font-mono text-[#2e2c29] underline underline-offset-2 break-all">
                        {SITE_URL.replace("https://", "")}{route.path}
                      </a>
                    </div>
                    {customised && (
                      <button onClick={() => resetPage(route.path)} className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-[#111] border border-black/15 rounded-lg px-2.5 py-1.5 hover:border-[#111] cursor-pointer">
                        <RotateCcw className="w-3.5 h-3.5" /> Use defaults
                      </button>
                    )}
                  </div>
                  <div>
                    <label htmlFor={`seo-t-${route.path}`} className={labelClass}>Title <Counter value={title || route.title} ideal={TITLE_IDEAL} /></label>
                    <input id={`seo-t-${route.path}`} className={inputClass} placeholder={route.title} value={title}
                      onChange={(e) => setPage(route.path, { title: e.target.value })} />
                  </div>
                  <div>
                    <label htmlFor={`seo-d-${route.path}`} className={labelClass}>Description <Counter value={description || route.description} ideal={DESC_IDEAL} /></label>
                    <textarea id={`seo-d-${route.path}`} rows={3} className={inputClass} placeholder={route.description} value={description}
                      onChange={(e) => setPage(route.path, { description: e.target.value })} />
                  </div>
                  <div>
                    <label htmlFor={`seo-i-${route.path}`} className={labelClass}>Share image link (optional)</label>
                    <input id={`seo-i-${route.path}`} className={inputClass} placeholder="Uses the default share image" value={o.image || ""}
                      onChange={(e) => setPage(route.path, { image: e.target.value })} />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-[#111] cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-[#111]" checked={Boolean(o.noindex)}
                      onChange={(e) => setPage(route.path, { noindex: e.target.checked })} />
                    Hide this page from Google
                  </label>
                </div>
                <GooglePreview url={SITE_URL + route.path} title={title || route.title} description={description || route.description} />
              </section>
            );
          })}
        </div>
      )}

      {/* ---------------- CREATOR PROFILES ---------------- */}
      {view === "profiles" && (
        <div className="bg-white/80 border border-black/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-black/10 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <p className="text-sm text-[#2e2c29]">
              Every creator has their own page. Titles and descriptions are written automatically from the profile; edit any of them here.
            </p>
            <div className="relative sm:w-72 shrink-0">
              <Search className="absolute left-3 top-3 w-4 h-4 text-[#57554f]" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search creators…"
                className={inputClass + " pl-9"} aria-label="Search creators" />
            </div>
          </div>
          <ul className="divide-y divide-black/10">
            {visibleProfiles.map((p) => {
              const key = profileKey(p.section.id, p.creator.name);
              const edit = profileEdits[key] || {};
              const autoTitle = defaultProfileTitle(p, liveSeo);
              const autoDesc = defaultProfileDescription(p);
              const isOpen = openProfile === key;
              const customised = Boolean(edit.title || edit.description || edit.slug || edit.noindex);
              return (
                <li key={key}>
                  <button onClick={() => setOpenProfile(isOpen ? null : key)} aria-expanded={isOpen}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-black/[0.03] cursor-pointer">
                    {/^https?:\/\//i.test(p.creator.image || "") || (p.creator.image || "").startsWith("data:image/") ? (
                      <img src={p.creator.image} alt="" className="w-10 h-10 rounded-lg object-cover border border-black/10 shrink-0" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="w-10 h-10 rounded-lg bg-stone-200 shrink-0" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-[#111] truncate">{p.creator.name}</span>
                      <span className="block text-xs font-mono text-[#47453f] truncate">{p.path}</span>
                    </span>
                    {edit.noindex && <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-stone-200 text-stone-800">Hidden</span>}
                    {customised && !edit.noindex && <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">Custom</span>}
                    <span className="text-xs text-[#47453f] hidden sm:inline">{p.section.title}</span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-5 pt-1 grid grid-cols-1 lg:grid-cols-2 gap-5 bg-white/60">
                      <div className="space-y-4 min-w-0">
                        <div>
                          <label htmlFor={`seo-slug-${key}`} className={labelClass}>Page address</label>
                          <div className="flex items-center rounded-lg border border-black/15 bg-white focus-within:border-[#111] overflow-hidden">
                            <span className="pl-3 pr-1 text-sm font-mono text-[#47453f] whitespace-nowrap">/talent/</span>
                            <input id={`seo-slug-${key}`} className="flex-1 min-w-0 py-2.5 pr-3 text-sm font-mono text-[#111] focus:outline-none"
                              placeholder={slugify(p.creator.name)} value={edit.slug || ""}
                              onChange={(e) => setProfile(key, { slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} />
                          </div>
                          <p className="text-xs text-[#47453f] mt-1">Lowercase letters, numbers and hyphens. Changing it changes the page link.</p>
                        </div>
                        <div>
                          <label htmlFor={`seo-pt-${key}`} className={labelClass}>Title <Counter value={edit.title || autoTitle} ideal={TITLE_IDEAL} /></label>
                          <input id={`seo-pt-${key}`} className={inputClass} placeholder={autoTitle} value={edit.title || ""}
                            onChange={(e) => setProfile(key, { title: e.target.value })} />
                        </div>
                        <div>
                          <label htmlFor={`seo-pd-${key}`} className={labelClass}>Description <Counter value={edit.description || autoDesc} ideal={DESC_IDEAL} /></label>
                          <textarea id={`seo-pd-${key}`} rows={3} className={inputClass} placeholder={autoDesc} value={edit.description || ""}
                            onChange={(e) => setProfile(key, { description: e.target.value })} />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <label className="flex items-center gap-2 text-sm text-[#111] cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 accent-[#111]" checked={Boolean(edit.noindex)}
                              onChange={(e) => setProfile(key, { noindex: e.target.checked })} />
                            Hide this profile from Google
                          </label>
                          <a href={p.path} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-[#111] underline underline-offset-2">
                            Open profile <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                      <GooglePreview url={SITE_URL + p.path} title={edit.title || autoTitle} description={edit.description || autoDesc} />
                    </div>
                  )}
                </li>
              );
            })}
            {visibleProfiles.length === 0 && <li className="p-10 text-center text-sm text-[#47453f]">No creators match your search.</li>}
          </ul>
        </div>
      )}

      {/* Save bar */}
      <div className="sticky bottom-4 z-10 flex justify-end">
        <div className="flex items-center gap-3 bg-white border border-black/15 shadow-lg rounded-xl px-4 py-3">
          <span className={`text-sm ${dirty ? "text-amber-800 font-semibold" : "text-[#47453f]"} inline-flex items-center gap-1.5`}>
            {dirty ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {dirty ? "Unsaved changes" : "All changes saved"}
          </span>
          <button onClick={save} disabled={saving || !dirty}
            className="inline-flex items-center gap-2 bg-[#111] hover:bg-[#222] text-white text-sm font-semibold px-5 py-2.5 rounded-lg cursor-pointer disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save SEO settings"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
