import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Upload, RotateCcw, Save, ExternalLink, Globe, Share2, Loader2 } from "lucide-react";
import { ROUTES, SITE_URL, OG_IMAGE, absoluteUrl, cleanPageOverrides, setPageOverrides, type PageOverride } from "../seo";
import { setHomeHero, setNavLabels, NAV_ITEMS, type HomeHero } from "../lib/siteContent";
import { uploadImage } from "../lib/adminUpload";

// Admin → Pages & SEO. Every public page: the text on the page, its Google title and
// description, and the card shown when the link is shared (WhatsApp, Facebook, X, LinkedIn).
// Empty fields keep the built-in text, shown as grey placeholder text.

const PAGES = ROUTES.filter((r) => r.tab !== "admin");

type TextKey = "title" | "description" | "heading" | "intro" | "ogTitle" | "ogDescription";

function Counter({ value, ideal, max }: { value: string; ideal: [number, number]; max: number }) {
  const n = value.length;
  const tone = n === 0 ? "text-ink-3" : n < ideal[0] || n > ideal[1] ? "text-[#9a5b13]" : "text-[#2f6b45]";
  return (
    <span className={`text-[0.75rem] tabular-nums ${tone}`}>
      {n}/{max} {n > 0 && (n < ideal[0] ? "· a bit short" : n > ideal[1] ? "· may be cut off" : "· good length")}
    </span>
  );
}

function Field({
  id,
  label,
  hint,
  value,
  placeholder,
  onChange,
  max,
  ideal,
  multiline
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  max: number;
  ideal?: [number, number];
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="field-label !mb-0">{label}</label>
        {ideal ? <Counter value={value || ""} ideal={ideal} max={max} /> : <span className="text-[0.75rem] text-ink-3 tabular-nums">{(value || "").length}/{max}</span>}
      </div>
      {multiline ? (
        <textarea id={id} rows={3} maxLength={max} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="field !h-auto min-h-[5.5rem] py-2.5" />
      ) : (
        <input id={id} type="text" maxLength={max} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="field" />
      )}
      {hint && <p className="text-[0.8125rem] text-ink-3">{hint}</p>}
    </div>
  );
}

export default function AdminPagesSeo({ token }: { token: string }) {
  const [pages, setPages] = useState<Record<string, PageOverride>>({});
  const [hero, setHero] = useState<HomeHero>({});
  const [nav, setNav] = useState<Record<string, string>>({});
  const [path, setPath] = useState("/");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setPages(cleanPageOverrides(data?.pages));
        setHero(data?.homeHero && typeof data.homeHero === "object" ? data.homeHero : {});
        setNav(data?.navLabels && typeof data.navLabels === "object" ? data.navLabels : {});
      })
      .catch(() => toast.error("Could not load the page settings."))
      .finally(() => setLoading(false));
  }, [token]);

  const base = useMemo(() => PAGES.find((r) => r.path === path) || PAGES[0], [path]);
  const o = pages[path] || {};
  const isHome = path === "/";

  const setField = (key: keyof PageOverride, value: string | boolean) => {
    setPages((prev) => {
      const next = { ...(prev[path] || {}), [key]: value } as PageOverride;
      if (value === "" || value === false) delete next[key];
      const all = { ...prev, [path]: next };
      if (!Object.keys(next).length) delete all[path];
      return all;
    });
    setDirty(true);
  };
  const setHeroField = (key: keyof HomeHero, value: string) => {
    setHero((h) => ({ ...h, [key]: value }));
    setDirty(true);
  };

  const resetPage = () => {
    setPages((prev) => {
      const all = { ...prev };
      delete all[path];
      return all;
    });
    if (isHome) setHero({});
    setDirty(true);
  };

  const onUpload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(token, file, 1600);
      setField("ogImage", url);
      toast.success("Image uploaded. Save to use it.");
    } catch (e: any) {
      toast.error(e?.message || "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const cleaned = cleanPageOverrides(pages);
      const heroClean: HomeHero = {};
      (["kicker", "headline", "accent", "intro"] as const).forEach((k) => {
        const v = (hero[k] || "").trim();
        if (v) heroClean[k] = v;
      });
      const navClean: Record<string, string> = {};
      NAV_ITEMS.forEach(({ id }) => {
        const v = (nav[id] || "").trim().slice(0, 30);
        if (v) navClean[id] = v;
      });
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pages: cleaned, homeHero: heroClean, navLabels: navClean })
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || "Save failed.");
      // Show the change on the site straight away (no reload needed)
      setPageOverrides(cleaned);
      setHomeHero(heroClean);
      setNavLabels(navClean);
      setNav(navClean);
      setPages(cleaned);
      setDirty(false);
      toast.success("Saved. Pages, Google text and share cards are updated.");
    } catch (e: any) {
      toast.error(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="py-16 text-center text-ink-2 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading pages…
      </p>
    );
  }

  const v = (k: TextKey) => (o[k] as string) || "";
  const title = v("title") || base.title;
  const description = v("description") || base.description;
  const shareTitle = v("ogTitle") || title;
  const shareDesc = v("ogDescription") || description;
  const shareImage = o.ogImage ? absoluteUrl(o.ogImage) : OG_IMAGE;
  const url = SITE_URL + base.path;

  return (
    <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] items-start text-ink">
      {/* Page list */}
      <nav aria-label="Pages" className="bg-white border border-line rounded-[4px] p-2 lg:sticky lg:top-4">
        <button
          type="button"
          onClick={() => setPath("__menu")}
          aria-current={path === "__menu" ? "page" : undefined}
          className={`w-full text-left px-2.5 py-2 mb-2 rounded-[3px] text-[0.9375rem] flex items-center justify-between gap-2 cursor-pointer border-b border-line ${path === "__menu" ? "bg-bronze-soft font-semibold" : "hover:bg-sunken"}`}
        >
          Menu names
          {Object.values(nav).some(Boolean) && <span className="w-2 h-2 rounded-full bg-bronze-fill shrink-0" aria-label="Edited" />}
        </button>
        <p className="px-2 pt-1 pb-2 text-[0.875rem] font-semibold text-bronze">Pages</p>
        <ul className="space-y-0.5">
          {PAGES.map((r) => {
            const changed = !!pages[r.path] || (r.path === "/" && Object.values(hero).some(Boolean));
            return (
              <li key={r.path}>
                <button
                  type="button"
                  onClick={() => setPath(r.path)}
                  aria-current={r.path === path ? "page" : undefined}
                  className={`w-full text-left px-2.5 py-2 rounded-[3px] text-[0.9375rem] flex items-center justify-between gap-2 cursor-pointer ${r.path === path ? "bg-bronze-soft font-semibold" : "hover:bg-sunken"}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate">{r.path === "/" ? "Home" : r.heading}</span>
                    <span className="block text-[0.75rem] text-ink-3 font-normal">{r.path}{pages[r.path]?.hidden ? " · hidden" : ""}</span>
                  </span>
                  {changed && <span className="w-2 h-2 rounded-full bg-bronze-fill shrink-0" title="Edited" aria-label="Edited" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {path === "__menu" ? (
        <div className="space-y-6 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-[1.75rem] leading-tight">Menu names</h2>
              <p className="text-[0.875rem] text-ink-3">The names in the top menu. Page addresses stay the same so links keep working.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => { setNav({}); setDirty(true); }} className="btn btn-secondary btn-sm">
                <RotateCcw className="w-4 h-4" aria-hidden="true" /> Use built-in names
              </button>
              <button type="button" onClick={save} disabled={saving || !dirty} className="btn btn-primary btn-sm disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
                {dirty ? "Save changes" : "Saved"}
              </button>
            </div>
          </div>
          <section className="bg-white border border-line rounded-[4px] p-5 grid gap-4 sm:grid-cols-2">
            {NAV_ITEMS.map((item) => {
              const route = ROUTES.find((r) => r.tab === item.id);
              return (
                <React.Fragment key={item.id}><Field
                  id={`nav-${item.id}`}
                  label={item.label}
                  hint={route ? `Opens ${route.path}` : "Opens a list of links"}
                  value={nav[item.id] || ""}
                  placeholder={item.label}
                  onChange={(x) => { setNav((n) => ({ ...n, [item.id]: x })); setDirty(true); }}
                  max={30}
                /></React.Fragment>
              );
            })}
          </section>
          <p className="text-[0.875rem] text-ink-3">Keep names short (one or two words) so the menu fits on one line.</p>
        </div>
      ) : (
      <div className="space-y-6 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-[1.75rem] leading-tight">{isHome ? "Home" : base.heading}</h2>
            <a href={base.path} target="_blank" rel="noreferrer" className="link text-[0.875rem] inline-flex items-center gap-1">
              Open page <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={resetPage} className="btn btn-secondary btn-sm">
              <RotateCcw className="w-4 h-4" aria-hidden="true" /> Use built-in text
            </button>
            <button type="button" onClick={save} disabled={saving || !dirty} className="btn btn-primary btn-sm disabled:opacity-50" id="save-pages-seo-btn">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
              {dirty ? "Save changes" : "Saved"}
            </button>
          </div>
        </div>

        {/* 0. Show or hide the whole page */}
        {!isHome && (
          <section className={`border rounded-[4px] p-5 ${o.hidden ? "bg-[#FBEFE2] border-[#E3C9A6]" : "bg-white border-line"}`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={!!o.hidden} onChange={(e) => setField("hidden", e.target.checked)} className="mt-1 w-5 h-5 accent-[var(--color-bronze-fill)]" id="hide-page-toggle" />
              <span>
                <span className="font-semibold text-[1.0625rem]">Hide this page from the website</span>
                <span className="block text-[0.875rem] text-ink-3 mt-0.5">
                  It disappears from the menu and footer and from Google. Anyone who opens the address sees "This page is not available right now". Untick and save to bring it back.
                </span>
              </span>
            </label>
          </section>
        )}

        {/* 1. On the page */}
        <section className="bg-white border border-line rounded-[4px] p-5 space-y-4">
          <h3 className="font-semibold text-[1.0625rem]">On the page</h3>
          {isHome ? (
            <>
              <Field id="hero-kicker" label="Small line above the headline" value={hero.kicker || ""} placeholder="Influencer Award directory" onChange={(x) => setHeroField("kicker", x)} max={80} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="hero-headline" label="Headline" value={hero.headline || ""} placeholder="Find the right creator" onChange={(x) => setHeroField("headline", x)} max={90} />
                <Field id="hero-accent" label="Headline, second line (bronze)" value={hero.accent || ""} placeholder="for your brand." onChange={(x) => setHeroField("accent", x)} max={90} />
              </div>
              <Field
                id="hero-intro"
                label="Text under the headline"
                value={hero.intro || ""}
                placeholder="Indian creators who applied for the Influencer Award. Our team reads every profile before it goes live. Pick someone you like and send us a brief."
                onChange={(x) => setHeroField("intro", x)}
                max={400}
                multiline
              />
            </>
          ) : (
            <>
              <Field id="page-heading" label="Page heading" value={v("heading")} placeholder={base.heading} onChange={(x) => setField("heading", x)} max={140} />
              <Field id="page-intro" label="Text under the heading" value={v("intro")} placeholder={base.intro} onChange={(x) => setField("intro", x)} max={600} multiline />
            </>
          )}
        </section>

        {/* 2. Google */}
        <section className="bg-white border border-line rounded-[4px] p-5 space-y-4">
          <h3 className="font-semibold text-[1.0625rem] flex items-center gap-2">
            <Globe className="w-4 h-4 text-bronze" aria-hidden="true" /> Google search
          </h3>
          <Field
            id="seo-title"
            label="Title in Google and the browser tab"
            hint="Put the main search words first, e.g. Influencer Award India."
            value={v("title")}
            placeholder={base.title}
            onChange={(x) => setField("title", x)}
            max={120}
            ideal={[30, 65]}
          />
          <Field
            id="seo-description"
            label="Description in Google"
            hint="One or two plain sentences that make someone click."
            value={v("description")}
            placeholder={base.description}
            onChange={(x) => setField("description", x)}
            max={320}
            ideal={[110, 165]}
            multiline
          />
          <label className="flex items-start gap-2.5 text-[0.9375rem] cursor-pointer">
            <input type="checkbox" checked={!!o.noindex} onChange={(e) => setField("noindex", e.target.checked)} className="mt-1 w-4 h-4 accent-[var(--color-bronze-fill)]" />
            <span>
              Hide this page from Google
              <span className="block text-[0.8125rem] text-ink-3">Only for pages that should not appear in search results.</span>
            </span>
          </label>
          <div className="border border-line rounded-[4px] p-4 bg-paper" aria-label="Google preview">
            <p className="text-[0.75rem] text-ink-3 mb-1">Preview in Google</p>
            <p className="text-[0.8125rem] text-[#1d6b37] truncate">{url}</p>
            <p className="text-[1.125rem] leading-snug text-[#1a0dab] line-clamp-1">{title}</p>
            <p className="text-[0.875rem] text-[#4d5156] line-clamp-2">{description}</p>
          </div>
        </section>

        {/* 3. Share card */}
        <section className="bg-white border border-line rounded-[4px] p-5 space-y-4">
          <h3 className="font-semibold text-[1.0625rem] flex items-center gap-2">
            <Share2 className="w-4 h-4 text-bronze" aria-hidden="true" /> Share card (WhatsApp, Facebook, X, LinkedIn)
          </h3>
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
            <div className="space-y-4">
              <Field id="og-title" label="Share title" hint="Leave empty to use the Google title." value={v("ogTitle")} placeholder={title} onChange={(x) => setField("ogTitle", x)} max={120} ideal={[25, 70]} />
              <Field id="og-description" label="Share description" value={v("ogDescription")} placeholder={description} onChange={(x) => setField("ogDescription", x)} max={320} ideal={[60, 200]} multiline />
              <div className="space-y-1.5">
                <label htmlFor="og-image" className="field-label !mb-0">Share image</label>
                <div className="flex gap-2">
                  <input id="og-image" type="url" value={o.ogImage || ""} placeholder="Default site image" onChange={(e) => setField("ogImage", e.target.value)} className="field flex-1 min-w-0" />
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn btn-secondary shrink-0">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Upload className="w-4 h-4" aria-hidden="true" />} Upload
                  </button>
                </div>
                <p className="text-[0.8125rem] text-ink-3">Best size 1200 × 630 pixels (wide). JPG or PNG.</p>
              </div>
            </div>
            <div aria-label="Share preview" className="self-start">
              <p className="text-[0.75rem] text-ink-3 mb-1">Preview when shared</p>
              <div className="border border-line rounded-[6px] overflow-hidden bg-[#f0f2f5]">
                <img src={shareImage} alt="" className="w-full aspect-[1.91/1] object-cover bg-sunken" referrerPolicy="no-referrer" />
                <div className="p-3 space-y-0.5">
                  <p className="text-[0.6875rem] uppercase text-ink-3">{new URL(SITE_URL).host}</p>
                  <p className="text-[0.9375rem] font-semibold leading-snug line-clamp-2">{shareTitle}</p>
                  <p className="text-[0.8125rem] text-ink-2 line-clamp-2">{shareDesc}</p>
                </div>
              </div>
            </div>
          </div>
          {path === "/creators/" && (
            <p className="text-[0.8125rem] text-ink-3 border-l-2 border-line-strong pl-3">
              A shared link to one creator's profile shows that creator's own name, bio and photo instead.
            </p>
          )}
        </section>
      </div>
      )}
    </div>
  );
}
