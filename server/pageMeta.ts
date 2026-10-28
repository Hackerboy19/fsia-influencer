// Puts the admin's page title, description and share card into the prerendered HTML before
// it is sent, so search engines and link previews (WhatsApp, Facebook, X, LinkedIn) see them
// without running JavaScript. Mirrors php-backend/api/page.php.
import { cleanPageOverrides, escapeHtml, absoluteUrl, OG_IMAGE } from "../src/seo";
import { slugify } from "../src/lib/profile";

export interface MetaValues {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noindex?: boolean;
  url?: string;
}

const setAttr = (html: string, pattern: RegExp, value: string) => html.replace(pattern, (_m, a, _old, b) => `${a}${escapeHtml(value)}${b}`);

export function injectMeta(html: string, m: MetaValues): string {
  let out = html;
  if (m.title) {
    out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(m.title)}</title>`);
  }
  if (m.description) out = setAttr(out, /(<meta name="description" content=")([^"]*)(")/, m.description);
  const ogTitle = m.ogTitle || m.title;
  const ogDescription = m.ogDescription || m.description;
  if (ogTitle) {
    out = setAttr(out, /(<meta property="og:title" content=")([^"]*)(")/, ogTitle);
    out = setAttr(out, /(<meta name="twitter:title" content=")([^"]*)(")/, ogTitle);
  }
  if (ogDescription) {
    out = setAttr(out, /(<meta property="og:description" content=")([^"]*)(")/, ogDescription);
    out = setAttr(out, /(<meta name="twitter:description" content=")([^"]*)(")/, ogDescription);
  }
  if (m.ogImage) {
    const img = absoluteUrl(m.ogImage);
    out = setAttr(out, /(<meta property="og:image" content=")([^"]*)(")/, img);
    out = setAttr(out, /(<meta name="twitter:image" content=")([^"]*)(")/, img);
    if (img !== OG_IMAGE) {
      // Size of an uploaded image is unknown: drop the fixed 1200x630 hints
      out = out.replace(/\s*<meta property="og:image:(width|height)" content="[^"]*" \/>/g, "");
    }
  }
  if (m.url) out = setAttr(out, /(<meta property="og:url" content=")([^"]*)(")/, m.url);
  if (m.noindex) out = setAttr(out, /(<meta name="robots" content=")([^"]*)(")/, "noindex, nofollow");
  return out;
}

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, n) : "");

/** Values for one request: the page's overrides, or a creator's own card for /creators/?profile=slug */
export function metaFor(pathname: string, profileSlug: string, settings: any, sections: any[], siteUrl: string): MetaValues | null {
  const pages = cleanPageOverrides(settings?.pages);
  const page = pages[pathname] || {};
  if (pathname === "/creators/" && profileSlug) {
    for (const section of sections || []) {
      for (const c of section?.creators || []) {
        if (c?.name && slugify(c.name) === profileSlug) {
          const role = clip(c.role, 80);
          const city = clip(c.city, 60);
          const title = `${clip(c.name, 80)}${role ? `, ${role}` : ""}${city ? ` (${city})` : ""}`;
          const bio = clip(c.bio, 200);
          return {
            title,
            description: bio || `${title}. See the profile and send an enquiry.`,
            ogImage: typeof c.image === "string" && /^(https?:\/\/|\/)/i.test(c.image) ? c.image : page.ogImage,
            url: `${siteUrl}/creators/?profile=${encodeURIComponent(profileSlug)}`
          };
        }
      }
    }
  }
  return Object.keys(page).length ? page : null;
}
