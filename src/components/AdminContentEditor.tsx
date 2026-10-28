import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Loader2, Save, Monitor, Smartphone, Upload, RotateCcw, X, MousePointerClick, ImageIcon, Type } from "lucide-react";
import { ROUTES } from "../seo";
import { ALL_PAGES, cleanContent, type ContentOverrides } from "../lib/contentOverrides";
import type { ContentPick } from "../lib/contentEditMode";
import { uploadImage } from "../lib/adminUpload";

// Admin → Page content. The real page opens on the left; clicking any text or image on it
// picks it, and the panel on the right changes it. Nothing is live until Save.

const PAGES = ROUTES.filter((r) => r.tab !== "admin");
const pageName = (path: string) => (path === ALL_PAGES ? "Every page (menu, footer)" : path === "/" ? "Home" : PAGES.find((r) => r.path === path)?.heading || path);

export default function AdminContentEditor({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<any>({});
  const [content, setContent] = useState<ContentOverrides>({});
  const [path, setPath] = useState("/");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [frameKey, setFrameKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [pick, setPick] = useState<ContentPick | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setSaved(data || {});
        setContent(cleanContent(data?.content));
      })
      .catch(() => toast.error("Could not load the page content settings."))
      .finally(() => setLoading(false));
  }, [token]);

  // The page in the frame gets the saved page settings plus the content being edited
  const payload = useCallback(
    (c: ContentOverrides) => ({ type: "fsia-preview", pages: saved.pages, homeHero: saved.homeHero, navLabels: saved.navLabels, content: c }),
    [saved]
  );
  const contentRef = useRef(content);
  contentRef.current = content;

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frameRef.current?.contentWindow) return;
      if (e.data?.type === "fsia-preview-ready") {
        frameRef.current?.contentWindow?.postMessage(payload(contentRef.current), window.location.origin);
        window.setTimeout(() => setReady(true), 300);
      } else if (e.data?.type === "fsia-edit-pick") {
        setPick(e.data as ContentPick);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [payload]);

  // Show each change in the page straight away
  useEffect(() => {
    if (ready) frameRef.current?.contentWindow?.postMessage(payload(content), window.location.origin);
  }, [content, ready, payload]);

  useEffect(() => {
    setReady(false);
    setPick(null);
    const t = window.setTimeout(() => setReady(true), 8000);
    return () => window.clearTimeout(t);
  }, [path, device, frameKey]);

  const kindKey = (p: ContentPick) => (p.kind === "text" ? "t" : "i");
  const valueFor = (p: ContentPick) => content[p.scope]?.[kindKey(p)]?.[p.original] || "";

  const setValue = (p: ContentPick, value: string, scope = p.scope) => {
    setContent((prev) => {
      const next: ContentOverrides = JSON.parse(JSON.stringify(prev));
      const k = kindKey(p);
      // One place per item: remove it from the other scope first
      for (const s of [p.scope, scope]) {
        if (next[s]?.[k]) delete next[s][k]![p.original];
      }
      if (value.trim() && value.trim() !== p.original) {
        next[scope] = next[scope] || {};
        (next[scope][k] ||= {})[p.original] = value;
      }
      for (const s of Object.keys(next)) {
        if (next[s].t && !Object.keys(next[s].t!).length) delete next[s].t;
        if (next[s].i && !Object.keys(next[s].i!).length) delete next[s].i;
        if (!next[s].t && !next[s].i) delete next[s];
      }
      return next;
    });
    setDirty(true);
  };

  const removeEntry = (scope: string, k: "t" | "i", original: string) => {
    setValue({ type: "fsia-edit-pick", kind: k === "t" ? "text" : "image", original, current: "", scope }, "");
    if (pick && pick.original === original) setPick({ ...pick });
  };

  const onUpload = async (file?: File) => {
    if (!file || !pick) return;
    setUploading(true);
    try {
      const url = await uploadImage(token, file, 1600);
      setValue(pick, url);
      toast.success("Image uploaded. Save to make it live.");
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
      const cleaned = cleanContent(content);
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: cleaned })
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || "Save failed.");
      setContent(cleaned);
      setDirty(false);
      toast.success("Saved. The changes are live on the website.");
    } catch (e: any) {
      toast.error(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="py-16 text-center text-ink-2 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading…
      </p>
    );
  }

  const entries = [path, ALL_PAGES].flatMap((scope) =>
    (["t", "i"] as const).flatMap((k) => Object.entries(content[scope]?.[k] || {}).map(([original, value]) => ({ scope, k, original, value })))
  );
  const totalChanges = (Object.values(content) as { t?: object; i?: object }[]).reduce((n: number, s) => n + Object.keys(s.t || {}).length + Object.keys(s.i || {}).length, 0);
  const current = pick ? valueFor(pick) : "";

  return (
    <div className="text-ink space-y-4" id="admin-content-editor">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[1.75rem] leading-tight">Page content</h2>
          <p className="text-[0.875rem] text-ink-3">Choose a page, then click any text or image on it to change it. Changes show straight away here and go live when you press Save.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="content-page-select">Page</label>
          <select id="content-page-select" value={path} onChange={(e) => setPath(e.target.value)} className="field !h-9 !py-0 w-auto">
            {PAGES.map((r) => (
              <option key={r.path} value={r.path}>{r.path === "/" ? "Home" : r.heading} ({r.path})</option>
            ))}
          </select>
          <div className="flex border border-line rounded-[4px] overflow-hidden" role="group" aria-label="Screen size">
            <button type="button" onClick={() => setDevice("desktop")} aria-pressed={device === "desktop"} className={`px-3 h-9 inline-flex items-center gap-1.5 text-[0.875rem] cursor-pointer ${device === "desktop" ? "bg-ink text-paper" : "bg-white text-ink"}`}>
              <Monitor className="w-4 h-4" aria-hidden="true" /> Desktop
            </button>
            <button type="button" onClick={() => setDevice("mobile")} aria-pressed={device === "mobile"} className={`px-3 h-9 inline-flex items-center gap-1.5 text-[0.875rem] cursor-pointer ${device === "mobile" ? "bg-ink text-paper" : "bg-white text-ink"}`}>
              <Smartphone className="w-4 h-4" aria-hidden="true" /> Mobile
            </button>
          </div>
          <button type="button" onClick={save} disabled={saving || !dirty} className="btn btn-primary btn-sm disabled:opacity-50" id="save-content-btn">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
            {dirty ? "Save changes" : "Saved"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] items-start">
        {/* The page */}
        <div className="bg-sunken border border-line rounded-[4px] p-2 flex justify-center h-[75vh] min-h-[32rem]">
          <div className={`relative bg-paper h-full ${device === "mobile" ? "w-[390px] border border-line-strong rounded-[12px] overflow-hidden" : "w-full"}`}>
            {!ready && (
              <p className="absolute inset-0 flex items-center justify-center gap-2 text-ink-2">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading page…
              </p>
            )}
            <iframe
              key={`${path}-${device}-${frameKey}`}
              ref={frameRef}
              title="Page being edited"
              src={`${path}?fsia-edit=1`}
              className={`w-full h-full border-0 ${ready ? "" : "opacity-0"}`}
            />
          </div>
        </div>

        {/* The editor */}
        <aside className="space-y-4 lg:sticky lg:top-4">
          <section className="bg-white border border-line rounded-[4px] p-4 space-y-3" aria-live="polite">
            {!pick ? (
              <p className="flex items-start gap-2 text-[0.9375rem] text-ink-2">
                <MousePointerClick className="w-5 h-5 shrink-0 text-bronze" aria-hidden="true" />
                Click a heading, a paragraph, a button or a photo on the page to change it.
              </p>
            ) : pick.kind === "text" ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold inline-flex items-center gap-2"><Type className="w-4 h-4 text-bronze" aria-hidden="true" /> Text</p>
                  <button type="button" onClick={() => setPick(null)} className="p-1 rounded hover:bg-sunken cursor-pointer" aria-label="Close"><X className="w-4 h-4" /></button>
                </div>
                <div>
                  <p className="text-[0.75rem] text-ink-3 mb-1">Built-in text</p>
                  <p className="text-[0.875rem] bg-sunken border border-line rounded-[3px] p-2 max-h-28 overflow-auto">{pick.original}</p>
                </div>
                <div>
                  <label htmlFor="content-new-text" className="field-label">New text</label>
                  <textarea
                    id="content-new-text"
                    rows={4}
                    maxLength={2000}
                    value={current || pick.original}
                    onChange={(e) => setValue(pick, e.target.value)}
                    className="field !h-auto py-2"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold inline-flex items-center gap-2"><ImageIcon className="w-4 h-4 text-bronze" aria-hidden="true" /> Image</p>
                  <button type="button" onClick={() => setPick(null)} className="p-1 rounded hover:bg-sunken cursor-pointer" aria-label="Close"><X className="w-4 h-4" /></button>
                </div>
                <img src={current || pick.original} alt="" className="w-full max-h-48 object-contain bg-sunken border border-line rounded-[3px]" referrerPolicy="no-referrer" />
                <div className="flex gap-2">
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn btn-secondary btn-sm flex-1">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Upload className="w-4 h-4" aria-hidden="true" />} Upload new image
                  </button>
                </div>
                <div>
                  <label htmlFor="content-new-image" className="field-label">Or image link</label>
                  <input id="content-new-image" type="url" value={current} placeholder="https://…" onChange={(e) => setValue(pick, e.target.value)} className="field" />
                </div>
              </>
            )}
            {pick && (
              <>
                <label className="flex items-start gap-2 text-[0.875rem] cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 accent-[var(--color-bronze-fill)]"
                    checked={pick.scope === ALL_PAGES}
                    onChange={(e) => {
                      const scope = e.target.checked ? ALL_PAGES : path;
                      const value = valueFor(pick);
                      setValue(pick, value, scope);
                      setPick({ ...pick, scope });
                    }}
                  />
                  <span>Change it on every page<span className="block text-[0.8125rem] text-ink-3">Use this for the menu, the footer and other text that repeats.</span></span>
                </label>
                {current && (
                  <button type="button" onClick={() => setValue(pick, "")} className="btn btn-secondary btn-sm w-full">
                    <RotateCcw className="w-4 h-4" aria-hidden="true" /> Back to the built-in {pick.kind === "text" ? "text" : "image"}
                  </button>
                )}
              </>
            )}
          </section>

          <section className="bg-white border border-line rounded-[4px] p-4">
            <p className="font-semibold">Changes on {pageName(path)} <span className="text-ink-3 font-normal">({entries.length})</span></p>
            {entries.length === 0 ? (
              <p className="text-[0.875rem] text-ink-3 mt-1">None yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line max-h-72 overflow-auto">
                {entries.map((en) => (
                  <li key={en.scope + en.k + en.original} className="py-2 flex items-start gap-2 text-[0.8125rem]">
                    <span className="min-w-0 flex-1">
                      <span className="block text-ink-3 line-through truncate">{en.original}</span>
                      <span className="block text-ink truncate">{en.value}</span>
                      {en.scope === ALL_PAGES && <span className="text-[0.75rem] text-bronze">every page</span>}
                    </span>
                    <button type="button" onClick={() => removeEntry(en.scope, en.k, en.original)} className="p-1 rounded hover:bg-sunken cursor-pointer shrink-0" aria-label={`Undo change to ${en.original}`}>
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {totalChanges > entries.length && <p className="text-[0.75rem] text-ink-3 mt-2">{totalChanges - entries.length} more on other pages.</p>}
          </section>

          <p className="text-[0.8125rem] text-ink-3">
            Creator profiles, campaigns and plans come from their own lists: change those in Creator Roster and Content Studio. Page titles for Google are in Pages &amp; SEO.
          </p>
          <button type="button" onClick={() => setFrameKey((k) => k + 1)} className="text-[0.8125rem] link cursor-pointer">Reload the page</button>
        </aside>
      </div>
    </div>
  );
}
