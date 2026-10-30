import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Loader2, Save, Upload, RotateCcw } from "lucide-react";
import { uploadImage } from "../lib/adminUpload";
import { setBrandLogo } from "../lib/siteContent";
import { BRAND_NAME } from "../content/brand";
import { SOCIAL_PLATFORMS, socialUrl, type SocialId } from "../lib/social";
import { cleanBrandSocial, setSiteExtras, getSiteExtras } from "../lib/siteExtras";

// Admin → Site settings: the logo, brand colour, footer line and the email address that
// gets an alert for every new application or enquiry.

interface BrandValues {
  logoUrl: string;
  logoHidesName: boolean;
  primaryColor: string;
  footerText: string;
  notifyEmail: string;
  social: Partial<Record<SocialId, string>>;
  socialHeader: boolean;
  socialFooter: boolean;
}

const DEFAULTS: BrandValues = {
  logoUrl: "",
  logoHidesName: false,
  primaryColor: "#E1C699",
  footerText: `© ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.`,
  notifyEmail: "",
  social: {},
  socialHeader: false,
  socialFooter: true
};

const currentExtras = () => {
  const x = getSiteExtras();
  return { brandSocial: x.social, popup: x.popup, ads: x.ads };
};

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function AdminBrandSettings({ token }: { token: string }) {
  const [values, setValues] = useState<BrandValues>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        const bs = cleanBrandSocial(d?.brandSocial);
        setValues({
          logoUrl: typeof d?.logoUrl === "string" ? d.logoUrl : "",
          logoHidesName: d?.logoHidesName === true,
          primaryColor: /^#[0-9a-f]{6}$/i.test(d?.primaryColor || "") ? d.primaryColor : DEFAULTS.primaryColor,
          footerText: typeof d?.footerText === "string" && d.footerText.trim() ? d.footerText : DEFAULTS.footerText,
          notifyEmail: typeof d?.notifyEmail === "string" ? d.notifyEmail : "",
          social: bs.links,
          socialHeader: bs.header,
          socialFooter: bs.footer
        });
      })
      .catch(() => toast.error("Could not load the site settings."))
      .finally(() => setLoading(false));
  }, [token]);

  const set = <K extends keyof BrandValues>(k: K, v: BrandValues[K]) => {
    setValues((prev) => ({ ...prev, [k]: v }));
    setDirty(true);
  };

  const onUpload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      set("logoUrl", await uploadImage(token, file, 600));
      toast.success("Logo uploaded. Press Save to use it.");
    } catch (e: any) {
      toast.error(e?.message || "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    if (values.notifyEmail.trim() && !isEmail(values.notifyEmail.trim())) {
      toast.error("The alert email address does not look right.");
      return;
    }
    const badSocial = SOCIAL_PLATFORMS.find((p) => (values.social[p.id] || "").trim() && !socialUrl(p.id, values.social[p.id]!));
    if (badSocial) {
      toast.error(`${badSocial.label}: that is not a valid handle or link.`);
      return;
    }
    setSaving(true);
    try {
      const links: Partial<Record<SocialId, string>> = {};
      for (const p of SOCIAL_PLATFORMS) {
        const url = socialUrl(p.id, values.social[p.id] || "");
        if (url) links[p.id] = url;
      }
      const brandSocial = { links, header: values.socialHeader, footer: values.socialFooter };
      const body = {
        brandSocial,
        logoUrl: values.logoUrl.trim(),
        logoHidesName: !!values.logoUrl.trim() && values.logoHidesName,
        primaryColor: values.primaryColor,
        footerText: values.footerText.trim().slice(0, 200),
        notifyEmail: values.notifyEmail.trim().slice(0, 200)
      };
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || "Save failed.");
      setBrandLogo(body.logoUrl, body.logoHidesName);
      setSiteExtras({ ...currentExtras(), brandSocial });
      setDirty(false);
      toast.success("Saved. The website now uses these settings.");
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

  return (
    <div className="text-ink space-y-6 max-w-3xl" id="admin-site-settings">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[1.75rem] leading-tight">Site settings</h2>
          <p className="text-[0.875rem] text-ink-3">Logo, brand colour, footer line, your social media and email alerts.</p>
        </div>
        <button type="button" onClick={save} disabled={saving || !dirty} className="btn btn-primary btn-sm disabled:opacity-50" id="save-site-settings-btn">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
          {dirty ? "Save changes" : "Saved"}
        </button>
      </div>

      <section className="bg-white border border-line rounded-[4px] p-5 space-y-4">
        <h3 className="font-semibold text-[1.0625rem]">Logo</h3>
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2.5 border border-line rounded-[4px] px-4 py-3 bg-paper min-w-[14rem]" aria-label="Logo preview">
            {values.logoUrl ? (
              <img src={values.logoUrl} alt="" className="h-9 w-auto max-w-[180px] object-contain" />
            ) : (
              <img src="/favicon.svg" alt="" className="w-8 h-8 rounded-[6px]" />
            )}
            {!(values.logoUrl && values.logoHidesName) && (
              <span className="wordmark text-ink" aria-hidden="true">
                {BRAND_NAME.split(" ").map((w) => (
                  <span key={w} className="block">{w}</span>
                ))}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="btn btn-secondary btn-sm" id="upload-logo-btn">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Upload className="w-4 h-4" aria-hidden="true" />} Upload logo
            </button>
            {values.logoUrl && (
              <button type="button" onClick={() => set("logoUrl", "")} className="btn btn-secondary btn-sm">
                <RotateCcw className="w-4 h-4" aria-hidden="true" /> Use the built-in logo
              </button>
            )}
          </div>
        </div>
        <p className="text-[0.8125rem] text-ink-3">PNG with a transparent background works best. It is shown in the menu and the footer on every page.</p>
        {values.logoUrl && (
          <label className="flex items-start gap-2.5 text-[0.9375rem] cursor-pointer">
            <input type="checkbox" checked={values.logoHidesName} onChange={(e) => set("logoHidesName", e.target.checked)} className="mt-1 w-4 h-4 accent-[var(--color-bronze-fill)]" />
            <span>My logo already shows the name<span className="block text-[0.8125rem] text-ink-3">Hides the text next to the logo.</span></span>
          </label>
        )}
      </section>

      <section className="bg-white border border-line rounded-[4px] p-5 space-y-4">
        <h3 className="font-semibold text-[1.0625rem]">Brand colour and footer</h3>
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="brand-colour" className="field-label !mb-0 w-40">Accent colour</label>
          <input id="brand-colour" type="color" value={values.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} className="w-12 h-10 border border-line rounded cursor-pointer" />
          <input type="text" value={values.primaryColor} onChange={(e) => /^#[0-9a-f]{0,6}$/i.test(e.target.value) && set("primaryColor", e.target.value)} className="field !w-32" aria-label="Accent colour code" />
          <button type="button" onClick={() => set("primaryColor", DEFAULTS.primaryColor)} className="link text-[0.875rem] cursor-pointer">Reset</button>
        </div>
        <p className="text-[0.8125rem] text-ink-3">Used for small highlights on dark areas. The site adjusts it if it would be hard to read.</p>
        <div>
          <label htmlFor="footer-text" className="field-label">Footer line</label>
          <input id="footer-text" type="text" maxLength={200} value={values.footerText} onChange={(e) => set("footerText", e.target.value)} className="field" />
        </div>
      </section>

      <section className="bg-white border border-line rounded-[4px] p-5 space-y-4" id="brand-social-settings">
        <h3 className="font-semibold text-[1.0625rem]">Your social media</h3>
        <p className="text-[0.8125rem] text-ink-3 -mt-2">The website's own pages, shown as icons. Type @handle or paste the link. Empty boxes are not shown.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SOCIAL_PLATFORMS.map((p) => {
            const v = values.social[p.id] || "";
            const bad = !!v.trim() && !socialUrl(p.id, v);
            return (
              <div key={p.id}>
                <label htmlFor={`brand-social-${p.id}`} className="field-label">{p.label}</label>
                <input
                  id={`brand-social-${p.id}`}
                  type="text"
                  placeholder={p.placeholder}
                  value={v}
                  aria-invalid={bad || undefined}
                  onChange={(e) => set("social", { ...values.social, [p.id]: e.target.value })}
                  className={`field ${bad ? "!border-red-500" : ""}`}
                />
                {bad && <p className="text-[0.75rem] text-red-700 mt-1">Not a valid {p.label} handle or link.</p>}
              </div>
            );
          })}
        </div>
        <fieldset className="flex flex-wrap gap-x-6 gap-y-2">
          <legend className="field-label">Show the icons in</legend>
          <label className="flex items-center gap-2 text-[0.9375rem] cursor-pointer">
            <input type="checkbox" id="brand-social-header" checked={values.socialHeader} onChange={(e) => set("socialHeader", e.target.checked)} className="w-4 h-4 accent-[var(--color-bronze-fill)]" />
            Header (top menu, every page)
          </label>
          <label className="flex items-center gap-2 text-[0.9375rem] cursor-pointer">
            <input type="checkbox" id="brand-social-footer" checked={values.socialFooter} onChange={(e) => set("socialFooter", e.target.checked)} className="w-4 h-4 accent-[var(--color-bronze-fill)]" />
            Footer (bottom of every page)
          </label>
        </fieldset>
        <p className="text-[0.8125rem] text-ink-3">In the header, icons show on wide screens next to search, and inside the Menu on phones and laptops.</p>
      </section>

      <section className="bg-white border border-line rounded-[4px] p-5 space-y-3">
        <h3 className="font-semibold text-[1.0625rem]">Email alerts</h3>
        <div>
          <label htmlFor="notify-email" className="field-label">Send an email to this address for every new application or enquiry</label>
          <input id="notify-email" type="email" placeholder="team@example.com" value={values.notifyEmail} onChange={(e) => set("notifyEmail", e.target.value)} className="field" />
        </div>
        <p className="text-[0.8125rem] text-ink-3">Leave empty for no emails. Alerts are sent by the hosting server; if they do not arrive, check the spam folder and ask the host to allow PHP mail.</p>
      </section>
    </div>
  );
}
