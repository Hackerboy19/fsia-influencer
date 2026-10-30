// Admin → Site settings extras: the brand's own social media links, a popup and ad banners.
// Everything is stored in the site settings and checked here before the site shows it.
import { SOCIAL_PLATFORMS, socialUrl, type SocialId } from "./social";

export const ALL = "*";

// ---------------------------------------------------------------- brand social media
export interface BrandSocial {
  links: Partial<Record<SocialId, string>>;
  header: boolean;
  footer: boolean;
}

/** Saved links are full https addresses (so brand-name rules never change them). */
export function cleanBrandSocial(input: unknown): BrandSocial {
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const raw = (o.links && typeof o.links === "object" ? o.links : {}) as Record<string, unknown>;
  const links: BrandSocial["links"] = {};
  for (const p of SOCIAL_PLATFORMS) {
    const url = typeof raw[p.id] === "string" ? socialUrl(p.id, raw[p.id] as string) : "";
    if (url) links[p.id] = url.slice(0, 300);
  }
  return { links, header: o.header === true, footer: o.footer !== false };
}

export const brandSocialList = (b: BrandSocial) =>
  SOCIAL_PLATFORMS.flatMap((p) => (b.links[p.id] ? [{ id: p.id, label: p.label, url: b.links[p.id]! }] : []));

// ---------------------------------------------------------------- popup
export type PopupFrequency = "once" | "daily" | "always";
export interface SitePopup {
  enabled: boolean;
  title: string;
  text: string;
  image: string;
  buttonLabel: string;
  buttonLink: string;
  /** Page paths ("/", "/creators/" …) or ["*"] for every page */
  pages: string[];
  delaySeconds: number;
  frequency: PopupFrequency;
  /** Changes whenever the popup is saved, so visitors see a new popup again */
  version: string;
}

const str = (v: unknown, n: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, n) : "");
const okImage = (v: unknown) => (typeof v === "string" && /^(https?:\/\/|\/)\S+$/i.test(v.trim()) ? v.trim().slice(0, 2000) : "");
/** Links may go to a page of this site (/apply/) or to an https address */
export const okLink = (v: unknown) => {
  const s = typeof v === "string" ? v.trim() : "";
  if (/^\/(?!\/)\S*$/.test(s)) return s.slice(0, 500);
  if (/^https?:\/\/[^\s/]+\.\S+$/i.test(s)) return s.slice(0, 500);
  return "";
};
const cleanPages = (v: unknown) => {
  const list = Array.isArray(v) ? v.filter((p): p is string => typeof p === "string" && (p === ALL || /^\/[a-z0-9\-\/]*$/i.test(p))).slice(0, 40) : [];
  return list.includes(ALL) || list.length === 0 ? [ALL] : list;
};

export function cleanPopup(input: unknown): SitePopup {
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const delay = Number(o.delaySeconds);
  const frequency: PopupFrequency = o.frequency === "daily" || o.frequency === "always" ? o.frequency : "once";
  const popup: SitePopup = {
    enabled: o.enabled === true,
    title: str(o.title, 120),
    text: typeof o.text === "string" ? o.text.trim().slice(0, 600) : "",
    image: okImage(o.image),
    buttonLabel: str(o.buttonLabel, 40),
    buttonLink: okLink(o.buttonLink),
    pages: cleanPages(o.pages),
    delaySeconds: Number.isFinite(delay) ? Math.min(60, Math.max(0, Math.round(delay))) : 3,
    frequency,
    version: str(o.version, 40)
  };
  // Nothing to show without a title, text or image
  if (!popup.title && !popup.text && !popup.image) popup.enabled = false;
  return popup;
}

// ---------------------------------------------------------------- ads
export type AdPosition = "top" | "bottom";
export interface SiteAd {
  id: string;
  enabled: boolean;
  /** Admin-only name, e.g. "Diwali sale – Brand X" */
  name: string;
  image: string;
  /** Shown on phones when set (a taller or smaller image) */
  mobileImage: string;
  link: string;
  /** Alternative text for people who cannot see the image */
  alt: string;
  pages: string[];
  position: AdPosition;
}

export function cleanAds(input: unknown): SiteAd[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, 30).flatMap((raw, i) => {
    const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const image = okImage(o.image);
    if (!image) return [];
    return [{
      id: str(o.id, 40).replace(/[^\w-]/g, "") || `ad-${i + 1}`,
      enabled: o.enabled !== false,
      name: str(o.name, 80),
      image,
      mobileImage: okImage(o.mobileImage),
      link: okLink(o.link),
      alt: str(o.alt, 160),
      pages: cleanPages(o.pages),
      position: o.position === "bottom" ? "bottom" : "top"
    }];
  });
}

export const showsOn = (pages: string[], path: string) => pages.includes(ALL) || pages.includes(path);

/** Ads for one page and position, in the order the admin listed them */
export const adsFor = (ads: SiteAd[], path: string, position: AdPosition) =>
  ads.filter((a) => a.enabled && a.position === position && showsOn(a.pages, path));

/** Whether this visitor should see the popup now (remembers per browser; storage may be blocked) */
export function popupDue(popup: SitePopup, path: string, storage: { getItem: (k: string) => string | null }): boolean {
  if (!popup.enabled || !showsOn(popup.pages, path) || path.startsWith("/admin")) return false;
  if (popup.frequency === "always") return true;
  const seen = storage.getItem("fsia_popup_seen");
  if (!seen) return true;
  const [version, at] = seen.split("|");
  if (version !== popup.version) return true;
  return popup.frequency === "daily" && Date.now() - Number(at || 0) > 24 * 60 * 60 * 1000;
}

// ---------------------------------------------------------------- current values (set when settings load)
let current = { social: cleanBrandSocial(undefined), popup: cleanPopup(undefined), ads: [] as SiteAd[] };
export function setSiteExtras(settings: { brandSocial?: unknown; popup?: unknown; ads?: unknown } | null | undefined) {
  current = { social: cleanBrandSocial(settings?.brandSocial), popup: cleanPopup(settings?.popup), ads: cleanAds(settings?.ads) };
}
export const getSiteExtras = () => current;
