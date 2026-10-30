import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Loader2, Save, Upload, Plus, Trash2, ArrowUp, ArrowDown, X, Eye } from "lucide-react";
import { PreviewModal } from "./AdminPagesSeo";
import { uploadImage } from "../lib/adminUpload";
import { ALL, cleanAds, cleanPopup, okLink, getSiteExtras, setSiteExtras, type SiteAd, type SitePopup } from "../lib/siteExtras";

// Admin → Popup & ads: one popup and any number of ad banners, each on the pages the admin picks.

const PAGE_NAMES: [string, string][] = [
  ["/", "Home"],
  ["/creators/", "Creators"],
  ["/categories/", "Categories"],
  ["/campaigns/", "Campaigns"],
  ["/magazine/", "Magazine"],
  ["/awards/", "Awards"],
  ["/apply/", "Apply"],
  ["/membership/", "Membership"],
  ["/star-india/", "Star India"],
  ["/for-brands/", "For brands"],
  ["/for-creators/", "For creators"],
  ["/faq/", "FAQ"],
  ["/contact/", "Contact"],
  ["/privacy/", "Privacy"],
  ["/gallery/", "3D gallery"]
];

const pagesText = (pages: string[], exclude: string[] = []) =>
  pages.includes(ALL)
    ? "Every page" + (exclude.length ? " (not the 3D gallery)" : "")
    : pages.map((p) => PAGE_NAMES.find(([path]) => path === p)?.[1] || p).join(", ");

const card = "bg-white border border-line rounded-[4px] p-5 space-y-4";

function PagePicker({ id, value, onChange, exclude = [] }: { id: string; value: string[]; onChange: (v: string[]) => void; exclude?: string[] }) {
  const all = value.includes(ALL);
  const toggle = (path: string) => {
    const list = value.filter((p) => p !== ALL);
    const next = list.includes(path) ? list.filter((p) => p !== path) : [...list, path];
    onChange(next.length ? next : [ALL]);
  };
  return (
    <fieldset id={id}>
      <legend className="field-label">Show on</legend>
      <label className="flex items-center gap-2 text-[0.9375rem] cursor-pointer mb-2">
        <input type="checkbox" checked={all} onChange={() => onChange(all ? ["/"] : [ALL])} className="w-4 h-4 accent-[var(--color-bronze-fill)]" />
        Every page
      </label>
      {!all && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 pl-1">
          {PAGE_NAMES.filter(([p]) => !exclude.includes(p)).map(([path, name]) => (
            <label key={path} className="flex items-center gap-2 text-[0.875rem] cursor-pointer">
              <input type="checkbox" checked={value.includes(path)} onChange={() => toggle(path)} className="w-4 h-4 accent-[var(--color-bronze-fill)]" />
              {name}
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

function ImageField({ id, label, value, onChange, token, maxSide, help }: { id: string; label: string; value: string; onChange: (v: string) => void; token: string; maxSide: number; help?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadImage(token, file, maxSide));
    } catch (e: any) {
      toast.error(e?.message || "Upload failed.");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };
  return (
    <div>
      <span className="field-label" id={`${id}-label`}>{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        {value ? <img src={value} alt="" className="h-16 w-auto max-w-[200px] object-contain border border-line bg-paper" /> : <span className="text-[0.875rem] text-ink-3">No image</span>}
        <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        <button type="button" id={`${id}-upload`} aria-describedby={`${id}-label`} onClick={() => ref.current?.click()} disabled={busy} className="btn btn-secondary btn-sm">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Upload className="w-4 h-4" aria-hidden="true" />} {value ? "Change" : "Upload"}
        </button>
        {value && (
          <button type="button" onClick={() => onChange("")} className="link text-[0.875rem] cursor-pointer">Remove</button>
        )}
      </div>
      {help && <p className="text-[0.8125rem] text-ink-3 mt-1">{help}</p>}
    </div>
  );
}

/** The popup as visitors will see it (same layout as the site) */
function PopupPreview({ p }: { p: SitePopup }) {
  return (
    <div className="bg-black/45 p-6 flex justify-center rounded-[4px]" aria-label="Popup preview">
      <div className="relative w-full max-w-sm bg-paper text-ink border border-line shadow-xl">
        <span className="absolute top-2 right-2 w-9 h-9 inline-flex items-center justify-center bg-paper/90" aria-hidden="true"><X className="w-5 h-5" /></span>
        {p.image && <img src={p.image} alt="" className="w-full max-h-56 object-cover" />}
        {(p.title || p.text || p.buttonLabel) && (
          <div className="p-5 space-y-2.5">
            {p.title && <p className="font-display text-[1.375rem] leading-tight pr-8">{p.title}</p>}
            {p.text && <p className="text-[0.875rem] text-ink-2 leading-relaxed whitespace-pre-line">{p.text}</p>}
            {p.buttonLabel && <span className="btn btn-primary btn-sm mt-1 pointer-events-none">{p.buttonLabel}</span>}
          </div>
        )}
        {!p.title && !p.text && !p.image && <p className="p-5 text-[0.875rem] text-ink-3">Add a title, text or image to see the popup.</p>}
      </div>
    </div>
  );
}

const newAd = (): SiteAd => ({ id: "ad-" + Date.now().toString(36), enabled: true, name: "", image: "", mobileImage: "", link: "", alt: "", pages: [ALL], position: "top" });

export default function AdminPromoPanel({ token }: { token: string }) {
  const [popup, setPopup] = useState<SitePopup>(cleanPopup(undefined));
  const [ads, setAds] = useState<SiteAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [previewPath, setPreviewPath] = useState("/");
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        // Keep everything the admin typed, even before an image is added
        const raw = d?.popup && typeof d.popup === "object" ? d.popup : {};
        setPopup({ ...cleanPopup(raw), enabled: raw.enabled === true });
        setAds(Array.isArray(d?.ads) ? d.ads.map((a: any) => ({ ...newAd(), ...a })) : []);
      })
      .catch(() => toast.error("Could not load the popup and ads."))
      .finally(() => setLoading(false));
  }, [token]);

  const editPopup = (patch: Partial<SitePopup>) => {
    setPopup((p) => ({ ...p, ...patch }));
    setDirty(true);
  };
  const editAd = (i: number, patch: Partial<SiteAd>) => {
    setAds((list) => list.map((a, n) => (n === i ? { ...a, ...patch } : a)));
    setDirty(true);
  };
  const moveAd = (i: number, by: number) => {
    setAds((list) => {
      const next = [...list];
      const [a] = next.splice(i, 1);
      next.splice(i + by, 0, a);
      return next;
    });
    setDirty(true);
  };

  const save = async () => {
    if (popup.enabled && !popup.title.trim() && !popup.text.trim() && !popup.image) {
      toast.error("The popup needs a title, text or image before it can be switched on.");
      return;
    }
    if (popup.buttonLabel.trim() && !okLink(popup.buttonLink)) {
      toast.error("Popup button link: use a page of this site like /apply/ or a full https:// address.");
      return;
    }
    const noImage = ads.findIndex((a) => !a.image);
    if (noImage >= 0) {
      toast.error(`Ad ${noImage + 1} has no image yet. Upload one or delete the ad.`);
      return;
    }
    const badLink = ads.findIndex((a) => a.link.trim() && !okLink(a.link));
    if (badLink >= 0) {
      toast.error(`Ad ${badLink + 1}: the link should be a page of this site like /apply/ or a full https:// address.`);
      return;
    }
    setSaving(true);
    try {
      // A new version makes visitors who closed the old popup see the new one
      const nextPopup = cleanPopup({ ...popup, version: Date.now().toString(36) });
      const nextAds = cleanAds(ads);
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ popup: nextPopup, ads: nextAds })
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || "Save failed.");
      const x = getSiteExtras();
      setSiteExtras({ brandSocial: x.social, popup: nextPopup, ads: nextAds });
      setPopup((p) => ({ ...p, version: nextPopup.version }));
      setDirty(false);
      toast.success("Saved. Visitors see the changes on their next page load.");
    } catch (e: any) {
      toast.error(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  // Shows the unsaved popup and ads on the real page (nothing is saved)
  const previewPayload = () => {
    const x = getSiteExtras();
    return {
      extras: {
        brandSocial: x.social,
        popup: { ...cleanPopup({ ...popup, delaySeconds: 0 }), enabled: popup.enabled && (!!popup.title.trim() || !!popup.text.trim() || !!popup.image), version: "preview" },
        ads: cleanAds(ads)
      }
    };
  };
  const popupOnPreviewPage = popup.pages.includes(ALL) || popup.pages.includes(previewPath);

  if (loading) {
    return (
      <p className="py-16 text-center text-ink-2 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading…
      </p>
    );
  }

  return (
    <div className="text-ink space-y-6 max-w-4xl" id="admin-promo">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[1.75rem] leading-tight">Popup &amp; ads</h2>
          <p className="text-[0.875rem] text-ink-3">An announcement popup and ad banners, on the pages you choose. Pick a page and press Preview to see it before saving.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="promo-preview-page" className="sr-only">Page to preview</label>
          <select id="promo-preview-page" value={previewPath} onChange={(e) => setPreviewPath(e.target.value)} className="field !h-9 !py-0 w-auto">
            {PAGE_NAMES.map(([path, name]) => <option key={path} value={path}>{name}</option>)}
          </select>
          {popup.enabled && !popupOnPreviewPage && (
            <span className="text-[0.8125rem] text-ink-3">The popup is not set for this page</span>
          )}
          <button type="button" onClick={() => setPreviewOpen(true)} className="btn btn-secondary btn-sm" id="preview-promo-btn">
            <Eye className="w-4 h-4" aria-hidden="true" /> Preview
          </button>
        <button type="button" onClick={save} disabled={saving || !dirty} className="btn btn-primary btn-sm disabled:opacity-50" id="save-promo-btn">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
          {dirty ? "Save changes" : "Saved"}
        </button>
        </div>
      </div>

      {previewOpen && (
        <PreviewModal
          path={previewPath}
          payload={previewPayload()}
          dirty={dirty}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {/* Popup */}
      <section className={card} id="popup-settings">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold text-[1.0625rem]">Popup</h3>
          <label className="flex items-center gap-2 text-[0.9375rem] font-medium cursor-pointer">
            <input type="checkbox" id="popup-enabled" checked={popup.enabled} onChange={(e) => editPopup({ enabled: e.target.checked })} className="w-4 h-4 accent-[var(--color-bronze-fill)]" />
            Show the popup on the website
          </label>
        </div>
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] gap-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="popup-title" className="field-label">Title</label>
              <input id="popup-title" className="field" maxLength={120} value={popup.title} onChange={(e) => editPopup({ title: e.target.value })} placeholder="e.g. Applications for the Influencer Award are open" />
            </div>
            <div>
              <label htmlFor="popup-text" className="field-label">Text</label>
              <textarea id="popup-text" className="field min-h-[90px]" maxLength={600} value={popup.text} onChange={(e) => editPopup({ text: e.target.value })} />
            </div>
            <ImageField id="popup-image" label="Image (optional)" value={popup.image} onChange={(v) => editPopup({ image: v })} token={token} maxSide={1200} help="Or use only an image, like a poster." />
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="popup-button-label" className="field-label">Button text (optional)</label>
                <input id="popup-button-label" className="field" maxLength={40} value={popup.buttonLabel} onChange={(e) => editPopup({ buttonLabel: e.target.value })} placeholder="Apply now" />
              </div>
              <div>
                <label htmlFor="popup-button-link" className="field-label">Button link</label>
                <input id="popup-button-link" className="field" value={popup.buttonLink} onChange={(e) => editPopup({ buttonLink: e.target.value })} placeholder="/apply/ or https://…" />
              </div>
            </div>
            <PagePicker id="popup-pages" value={popup.pages} onChange={(pages) => editPopup({ pages })} />
            <p className="text-[0.875rem]" data-popup-where><strong>Shows on:</strong> {pagesText(popup.pages)}{popup.enabled ? "" : " (switched off)"}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="popup-delay" className="field-label">Open after (seconds)</label>
                <input id="popup-delay" type="number" min={0} max={60} className="field" value={popup.delaySeconds} onChange={(e) => editPopup({ delaySeconds: Math.min(60, Math.max(0, Number(e.target.value) || 0)) })} />
              </div>
              <div>
                <label htmlFor="popup-frequency" className="field-label">How often</label>
                <select id="popup-frequency" className="field" value={popup.frequency} onChange={(e) => editPopup({ frequency: e.target.value as SitePopup["frequency"] })}>
                  <option value="once">Once per visitor</option>
                  <option value="daily">Once a day</option>
                  <option value="always">Every page they open</option>
                </select>
              </div>
            </div>
          </div>
          <div>
            <p className="field-label">Preview</p>
            <PopupPreview p={popup} />
          </div>
        </div>
      </section>

      {/* Ads */}
      <section className={card} id="ads-settings">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-[1.0625rem]">Ads</h3>
            <p className="text-[0.8125rem] text-ink-3">Image banners at the top or bottom of a page. Each one is labelled "Advertisement" on the site.</p>
          </div>
          <button type="button" id="add-ad-btn" onClick={() => { setAds((l) => [...l, newAd()]); setDirty(true); }} className="btn btn-secondary btn-sm">
            <Plus className="w-4 h-4" aria-hidden="true" /> Add an ad
          </button>
        </div>

        {ads.length === 0 && <p className="text-[0.9375rem] text-ink-3">No ads yet.</p>}

        <ol className="space-y-4">
          {ads.map((ad, i) => (
            <li key={ad.id} className="border border-line rounded-[4px] p-4 space-y-4" data-ad-editor={i}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-[0.875rem] font-semibold">Ad {i + 1}</span>
                  <label className="flex items-center gap-2 text-[0.875rem] cursor-pointer">
                    <input type="checkbox" checked={ad.enabled} onChange={(e) => editAd(i, { enabled: e.target.checked })} className="w-4 h-4 accent-[var(--color-bronze-fill)]" />
                    Live
                  </label>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => moveAd(i, -1)} disabled={i === 0} aria-label={`Move ad ${i + 1} up`} className="w-9 h-9 inline-flex items-center justify-center rounded-[4px] hover:bg-sunken disabled:opacity-30 cursor-pointer"><ArrowUp className="w-4 h-4" aria-hidden="true" /></button>
                  <button type="button" onClick={() => moveAd(i, 1)} disabled={i === ads.length - 1} aria-label={`Move ad ${i + 1} down`} className="w-9 h-9 inline-flex items-center justify-center rounded-[4px] hover:bg-sunken disabled:opacity-30 cursor-pointer"><ArrowDown className="w-4 h-4" aria-hidden="true" /></button>
                  <button type="button" onClick={() => { if (window.confirm(`Delete ad ${i + 1}?`)) { setAds((l) => l.filter((_, n) => n !== i)); setDirty(true); } }} aria-label={`Delete ad ${i + 1}`} className="w-9 h-9 inline-flex items-center justify-center rounded-[4px] text-red-700 hover:bg-red-50 cursor-pointer"><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`ad-name-${i}`} className="field-label">Name (only you see this)</label>
                  <input id={`ad-name-${i}`} className="field" maxLength={80} value={ad.name} onChange={(e) => editAd(i, { name: e.target.value })} placeholder="e.g. Brand X, November" />
                </div>
                <div>
                  <label htmlFor={`ad-link-${i}`} className="field-label">Link when clicked (optional)</label>
                  <input id={`ad-link-${i}`} className="field" value={ad.link} onChange={(e) => editAd(i, { link: e.target.value })} placeholder="https://brand.com or /campaigns/" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <ImageField id={`ad-image-${i}`} label="Banner image" value={ad.image} onChange={(v) => editAd(i, { image: v })} token={token} maxSide={1800} help="Wide image, e.g. 1600 × 400." />
                <ImageField id={`ad-mobile-${i}`} label="Phone image (optional)" value={ad.mobileImage} onChange={(v) => editAd(i, { mobileImage: v })} token={token} maxSide={1000} help="Shown on phones instead, e.g. 800 × 600." />
              </div>
              <div>
                <label htmlFor={`ad-alt-${i}`} className="field-label">What the image says (for blind visitors and Google)</label>
                <input id={`ad-alt-${i}`} className="field" maxLength={160} value={ad.alt} onChange={(e) => editAd(i, { alt: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-[minmax(0,1fr)_12rem] gap-4">
                <div className="space-y-2">
                  <PagePicker id={`ad-pages-${i}`} value={ad.pages} onChange={(pages) => editAd(i, { pages })} exclude={["/gallery/"]} />
                  <p className="text-[0.875rem]"><strong>Shows on:</strong> {pagesText(ad.pages, ["/gallery/"])}, {ad.position === "top" ? "top of the page" : "bottom, above the footer"}{ad.enabled ? "" : " (switched off)"}</p>
                </div>
                <div>
                  <label htmlFor={`ad-position-${i}`} className="field-label">Place</label>
                  <select id={`ad-position-${i}`} className="field" value={ad.position} onChange={(e) => editAd(i, { position: e.target.value as SiteAd["position"] })}>
                    <option value="top">Top of the page</option>
                    <option value="bottom">Bottom, above the footer</option>
                  </select>
                </div>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-[0.8125rem] text-ink-3">The 3D gallery is a full-screen page, so ads are not shown there.</p>
      </section>
    </div>
  );
}
