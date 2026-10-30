// Puts the admin's page title, description and share card into the prerendered HTML before
// it is sent, so search engines and link previews (WhatsApp, Facebook, X, LinkedIn) see them
// without running JavaScript. Mirrors php-backend/api/page.php.
import { cleanPageOverrides, escapeHtml, absoluteUrl, OG_IMAGE } from "../src/seo";
import { cleanContent, ALL_PAGES } from "../src/lib/contentOverrides";
import { slugify } from "../src/lib/profile";

export interface MetaValues {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noindex?: boolean;
  url?: string;
  keywords?: string;
  /** Admin → Page content replacements for this page: [built-in, new] pairs */
  texts?: [string, string][];
  images?: [string, string][];
  /** Page heading (H1) set in the admin */
  heading?: string;
  /** Valid compact JSON-LD from Admin → Pages & SEO */
  schema?: string;
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
  if (m.keywords) {
    out = out.replace(/(<meta name="description" content="[^"]*" \/>)/, (tag) => `${tag}\n    <meta name="keywords" content="${escapeHtml(m.keywords!)}" />`);
  }
  if (m.schema) {
    const block = `<script type="application/ld+json" id="page-schema">${m.schema.replace(/</g, "\\u003c")}</script>\n  `;
    out = out.replace("</head>", () => block + "</head>");
  }
  if (m.texts?.length || m.images?.length) {
    // Same escaping React uses for text and attributes in the prerendered HTML
    const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
    const reEsc = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const at = out.indexOf('<div id="root">');
    if (at >= 0) {
      let body = out.slice(at);
      for (const [from, to] of m.texts || []) {
        body = body.replace(new RegExp(">(\\s*)" + reEsc(esc(from)) + "(\\s*)<", "g"), (_x, a, b) => `>${a}${esc(to)}${b}<`);
      }
      for (const [from, to] of m.images || []) {
        body = body.split(`src="${esc(from)}"`).join(`src="${esc(to)}"`);
      }
      out = out.slice(0, at) + body;
    }
  }
  if (m.heading) {
    // The first H1 of the page content in the prerendered HTML (the app redraws it in the browser)
    const at = out.search(/id="main-content"|class="seo-fallback"/);
    if (at >= 0) {
      const rest = out.slice(at).replace(/(<h1\b[^>]*>)[\s\S]*?(<\/h1>)/, (_m, a, b) => a + escapeHtml(m.heading!) + b);
      out = out.slice(0, at) + rest;
    }
  }
  return out;
}

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, n) : "");

/** Values for one request: the page's overrides, or a creator's own card for /creators/?profile=slug */
export function metaFor(pathname: string, profileSlug: string, settings: any, sections: any[], siteUrl: string): MetaValues | null {
  const pages = cleanPageOverrides(settings?.pages);
  const page = pages[pathname] || {};
  const content = cleanContent(settings?.content);
  const pairs = (k: "t" | "i") => {
    const merged = { ...(content[ALL_PAGES]?.[k] || {}), ...(content[pathname]?.[k] || {}) };
    return Object.entries(merged) as [string, string][];
  };
  const texts = pairs("t");
  const images = pairs("i");
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
            url: `${siteUrl}/creators/?profile=${encodeURIComponent(profileSlug)}`,
            keywords: page.keywords,
            schema: page.schema,
            texts,
            images
          };
        }
      }
    }
  }
  if (!Object.keys(page).length && !texts.length && !images.length) return null;
  return { ...page, noindex: !!(page.noindex || page.hidden), texts, images };
}
