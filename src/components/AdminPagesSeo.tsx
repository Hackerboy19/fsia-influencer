import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Upload, RotateCcw, Save, ExternalLink, Globe, Share2, Loader2, Heading, Code2, Eye, X, Monitor, Smartphone } from "lucide-react";
import { ROUTES, SITE_URL, OG_IMAGE, absoluteUrl, cleanPageOverrides, cleanSchema, setPageOverrides, type PageOverride } from "../seo";
import { pageHeadings, originalText } from "../lib/headingOverrides";
import { Portal } from "../lib/dialog";
import { setHomeHero, setNavLabels, NAV_ITEMS, type HomeHero } from "../lib/siteContent";
import { uploadImage } from "../lib/adminUpload";

// Admin → Pages & SEO. Every public page: the text on the page, its Google title and
// description, and the card shown when the link is shared (WhatsApp, Facebook, X, LinkedIn).
// Empty fields keep the built-in text, shown as grey placeholder text.

const PAGES = ROUTES.filter((r) => r.tab !== "admin");

type TextKey = "title" | "description" | "heading" | "intro" | "ogTitle" | "ogDescription" | "keywords" | "h2a" | "h2b" | "h3a" | "h3b" | "h3c" | "schema";

const HEADING_SLOTS = [
  { key: "h2a", tag: "h2", n: 0, label: "H2 (1)" },
  { key: "h2b", tag: "h2", n: 1, label: "H2 (2)" },
  { key: "h3a", tag: "h3", n: 0, label: "H3 (1)" },
  { key: "h3b", tag: "h3", n: 1, label: "H3 (2)" },
  { key: "h3c", tag: "h3", n: 2, label: "H3 (3)" }
] as const;

/** The page's own H2 and H3 text, read from the live page in a hidden frame. */
function useCurrentHeadings(path: string) {
  const [found, setFound] = useState<{ h2: string[]; h3: string[] } | null>(null);
  useEffect(() => {
    setFound(null);
    if (path === "__menu") return;
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    frame.style.cssText = "position:absolute;width:1280px;height:800px;left:-99999px;top:0;border:0;visibility:hidden";
    let tries = 0;
    let timer = 0;
    const read = () => {
      try {
        const root = frame.contentDocument?.getElementById("main-content");
        const h2 = root ? pageHeadings(root, "h2").slice(0, 2).map(originalText) : [];
        const h3 = root ? pageHeadings(root, "h3").slice(0, 3).map(originalText) : [];
        if ((h2.length || h3.length) && tries >= 3) return setFound({ h2, h3 });
        if (++tries > 16) return setFound({ h2, h3 });
      } catch {
        return setFound({ h2: [], h3: [] });
      }
      timer = window.setTimeout(read, 500);
    };
    frame.onload = () => { timer = window.setTimeout(read, 500); };
    frame.src = path;
    document.body.appendChild(frame);
    return () => { window.clearTimeout(timer); frame.remove(); };
  }, [path]);
  return found;
}

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
  const current = useCurrentHeadings(path);
  const [previewOpen, setPreviewOpen] = useState(false);

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

  // What gets saved (and what the preview shows): trimmed, capped, invalid values dropped
  const buildPayload = () => {
    const cleanedPages = cleanPageOverrides(pages);
    const heroClean: HomeHero = {};
    (["kicker", "headline", "accent", "intro"] as const).forEach((k) => {
      const val = (hero[k] || "").trim();
      if (val) heroClean[k] = val;
    });
    const navClean: Record<string, string> = {};
    NAV_ITEMS.forEach(({ id }) => {
      const val = (nav[id] || "").trim().slice(0, 30);
      if (val) navClean[id] = val;
    });
    return { pages: cleanedPages, homeHero: heroClean, navLabels: navClean };
  };

  const save = async () => {
    const badSchema = (Object.entries(pages) as [string, PageOverride][]).find(([, po]) => !!po.schema && !!po.schema.trim() && !cleanSchema(po.schema));
    if (badSchema) {
      setPath(badSchema[0]);
      toast.error("The JSON-LD schema is not valid JSON. Fix it or clear the box, then save.");
      return;
    }
    setSaving(true);
    try {
      const { pages: cleaned, homeHero: heroClean, navLabels: navClean } = buildPayload();
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
              <button type="button" onClick={() => setPreviewOpen(true)} className="btn btn-secondary btn-sm" >
                <Eye className="w-4 h-4" aria-hidden="true" /> Preview
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
            <button type="button" onClick={() => setPreviewOpen(true)} className="btn btn-secondary btn-sm" >
                <Eye className="w-4 h-4" aria-hidden="true" /> Preview
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
          <h3 className="font-semibold text-[1.0625rem] flex items-center gap-2"><Heading className="w-4 h-4 text-bronze" aria-hidden="true" /> Heading tags (on-page SEO)</h3>
          {isHome ? (
            <>
              <Field id="hero-kicker" label="Small line above the headline" value={hero.kicker || ""} placeholder="Influencer Award directory" onChange={(x) => setHeroField("kicker", x)} max={80} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="hero-headline" label="H1 heading" value={hero.headline || ""} placeholder="Find the right creator" onChange={(x) => setHeroField("headline", x)} max={90} />
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
              <Field id="page-heading" label="H1 heading" hint="The main heading on the page. Use your main search words." value={v("heading")} placeholder={base.heading} onChange={(x) => setField("heading", x)} max={140} />
              <Field id="page-intro" label="Text under the heading" value={v("intro")} placeholder={base.intro} onChange={(x) => setField("intro", x)} max={600} multiline />
            </>
          )}
          <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-line" id="heading-tag-fields">
            {HEADING_SLOTS.map((slot) => {
              const own = current ? (slot.tag === "h2" ? current.h2 : current.h3)[slot.n] : undefined;
              return (
                <React.Fragment key={slot.key}>
                  <Field
                    id={`seo-${slot.key}`}
                    label={slot.label}
                    hint={current === null ? "Reading the page's own heading…" : own ? `Now: ${own}` : `This page has no ${slot.label.replace(/ \(.*/, "")} in this place.`}
                    value={v(slot.key)}
                    placeholder={own || "Leave empty to keep the page's own heading"}
                    onChange={(x) => setField(slot.key, x)}
                    max={140}
                  />
                </React.Fragment>
              );
            })}
          </div>
          <p className="text-[0.8125rem] text-ink-3">Empty boxes keep the page's own headings. H2 (1) replaces the first H2 on the page, H3 (1) the first H3, and so on.</p>
        </section>

        {/* 2. Google */}
        <section className="bg-white border border-line rounded-[4px] p-5 space-y-4">
          <h3 className="font-semibold text-[1.0625rem] flex items-center gap-2">
            <Globe className="w-4 h-4 text-bronze" aria-hidden="true" /> Google search
          </h3>
          <Field
            id="seo-title"
            label="Meta title"
            hint="Shown in Google and the browser tab. Put the main search words first, e.g. Influencer Award India."
            value={v("title")}
            placeholder={base.title}
            onChange={(x) => setField("title", x)}
            max={120}
            ideal={[30, 65]}
          />
          <Field
            id="seo-description"
            label="Meta description"
            hint="One or two plain sentences that make someone click."
            value={v("description")}
            placeholder={base.description}
            onChange={(x) => setField("description", x)}
            max={320}
            ideal={[110, 165]}
            multiline
          />
          <Field
            id="seo-keywords"
            label="Keywords (comma-separated)"
            hint="e.g. influencer award, influencer award India, creator award. Google mostly ignores this tag; the title, headings and text matter more."
            value={v("keywords")}
            placeholder="influencer award, influencer award India"
            onChange={(x) => setField("keywords", x)}
            max={300}
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
                <label htmlFor="og-image" className="field-label !mb-0">Social share image (OG, 1200×630)</label>
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

        {/* 4. JSON-LD */}
        <section className="bg-white border border-line rounded-[4px] p-5 space-y-3">
          <h3 className="font-semibold text-[1.0625rem] flex items-center gap-2">
            <Code2 className="w-4 h-4 text-bronze" aria-hidden="true" /> JSON-LD Schema Markup
          </h3>
          <p className="text-[0.875rem] text-ink-3">
            The site already adds Organization, WebSite, WebPage and Breadcrumb schema to every page{path === "/faq/" ? ", and FAQPage here" : ""}. Paste extra schema here (one JSON object, or a list of objects). Only add facts that are true and shown on the page.
          </p>
          <textarea
            id="seo-schema"
            rows={8}
            spellCheck={false}
            value={v("schema")}
            placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "Event",\n  "name": "Influencer Award 2026"\n}'}
            onChange={(e) => setField("schema", e.target.value)}
            className="field !h-auto min-h-[10rem] py-2.5 font-mono text-[0.8125rem]"
            aria-describedby="seo-schema-status"
          />
          {(() => {
            const raw = v("schema").trim();
            if (!raw) return <p id="seo-schema-status" className="text-[0.8125rem] text-ink-3">Empty: only the built-in schema is used.</p>;
            const ok = cleanSchema(raw);
            return ok ? (
              <p id="seo-schema-status" className="text-[0.8125rem] text-[#2f6b45]">Valid JSON. It will be added to this page. Check it with Google's Rich Results Test after saving.</p>
            ) : (
              <p id="seo-schema-status" role="alert" className="text-[0.8125rem] text-[#a3341f]">This is not valid JSON-LD (it must be a JSON object or a list of objects). It will not be saved until it is fixed.</p>
            );
          })()}
        </section>
      </div>
      )}
      {previewOpen && (
        <PreviewModal
          path={path === "__menu" ? "/" : path}
          payload={buildPayload()}
          dirty={dirty}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
}

/** The real page in a frame, showing the unsaved changes. */
export function PreviewModal({ path, payload, dirty, onClose }: { path: string; payload: object; dirty: boolean; onClose: () => void }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [ready, setReady] = useState(false);
  const data = useRef(payload);
  data.current = payload;
  // Never leave the frame hidden if the page does not answer
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 6000);
    return () => window.clearTimeout(t);
  }, [device]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frameRef.current?.contentWindow) return;
      if (e.data?.type !== "fsia-preview-ready") return;
      frameRef.current?.contentWindow?.postMessage({ type: "fsia-preview", ...data.current }, window.location.origin);
      window.setTimeout(() => setReady(true), 300);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("message", onMessage);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <Portal>
    <div className="fixed inset-0 z-[90] bg-ink/70 flex flex-col" role="dialog" aria-modal="true" aria-label="Page preview" id="page-preview-modal">
      <div className="bg-paper border-b border-line flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
        <div className="min-w-0">
          <p className="font-semibold text-ink">Preview of {path}</p>
          <p className="text-[0.8125rem] text-ink-3">{dirty ? "Shows your changes before saving. Nothing is live until you press Save." : "No unsaved changes: this is how the page looks now."}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-line rounded-[4px] overflow-hidden" role="group" aria-label="Screen size">
            <button type="button" onClick={() => { setReady(false); setDevice("desktop"); }} aria-pressed={device === "desktop"} className={`px-3 h-9 inline-flex items-center gap-1.5 text-[0.875rem] cursor-pointer ${device === "desktop" ? "bg-ink text-paper" : "bg-white text-ink"}`}>
              <Monitor className="w-4 h-4" aria-hidden="true" /> Desktop
            </button>
            <button type="button" onClick={() => { setReady(false); setDevice("mobile"); }} aria-pressed={device === "mobile"} className={`px-3 h-9 inline-flex items-center gap-1.5 text-[0.875rem] cursor-pointer ${device === "mobile" ? "bg-ink text-paper" : "bg-white text-ink"}`}>
              <Smartphone className="w-4 h-4" aria-hidden="true" /> Mobile
            </button>
          </div>
          <button type="button" onClick={onClose} className="btn btn-primary btn-sm" autoFocus>
            <X className="w-4 h-4" aria-hidden="true" /> Close preview
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto flex justify-center p-3">
        <div className={`relative bg-paper h-full ${device === "mobile" ? "w-[390px] border border-line-strong rounded-[12px] overflow-hidden" : "w-full"}`}>
          {!ready && (
            <p className="absolute inset-0 flex items-center justify-center gap-2 text-ink-2">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading preview…
            </p>
          )}
          <iframe
            key={device}
            ref={frameRef}
            title="Page preview"
            src={`${path}?fsia-preview=1`}
            className={`w-full h-full border-0 ${ready ? "" : "opacity-0"}`}
          />
        </div>
      </div>
    </div>
    </Portal>
  );
}
