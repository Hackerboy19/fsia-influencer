// Single source of truth for URLs, titles, descriptions and structured data.
//
// Defaults live in ROUTES below; the admin panel (Admin → SEO) stores overrides
// for the whole site, each page and each creator profile. The same resolution
// rules run in three places and must stay in sync:
//   - here, in the browser, to update <head> as visitors move around
//   - here, in the Node server (server.ts), which renders each page's <head>
//   - php-backend/api/lib/seo.php, which does the same on PHP hosting
// scripts/prerender-seo.ts also uses it to write static fallbacks at build time.
import { FAQS } from "./content/faqs";

export const SITE_URL = "https://influencer.fsia.in";
export const SITE_NAME = "FSIA Influencer";
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

export type TabId = "catwalk" | "directory" | "campaigns" | "membership" | "apply" | "faq" | "admin";

export interface RouteMeta {
  tab: TabId;
  path: string;
  title: string;
  description: string;
  heading: string;
  indexable: boolean;
  priority: string;
  changefreq: "daily" | "weekly" | "monthly";
}

export const ROUTES: RouteMeta[] = [
  {
    tab: "catwalk",
    path: "/",
    title: "FSIA Creators & Influencer Portal | Connect & Collaborate",
    description:
      "Join the official influencer network. Register and access exclusive brand collaborations, creator campaigns, and profile management.",
    heading: "FSIA Creators & Influencer Portal",
    indexable: true,
    priority: "1.0",
    changefreq: "weekly"
  },
  {
    tab: "directory",
    path: "/talent/",
    title: "Verified Creators & Influencers Roster | FSIA Influencer",
    description:
      "Browse verified Indian creators and influencers by category, city, reach and engagement, and send a collaboration request in minutes.",
    heading: "Verified Creator & Influencer Roster",
    indexable: true,
    priority: "0.9",
    changefreq: "daily"
  },
  {
    tab: "campaigns",
    path: "/campaigns/",
    title: "Brand Campaigns & Paid Collaborations for Creators | FSIA Influencer",
    description:
      "Discover live paid brand campaigns for creators across fashion, travel, lifestyle and tech. See budgets, requirements and perks, then apply.",
    heading: "Live Brand Campaigns for Creators",
    indexable: true,
    priority: "0.9",
    changefreq: "daily"
  },
  {
    tab: "apply",
    path: "/join/",
    title: "Register as a Creator & Get Verified | FSIA Influencer",
    description:
      "Create your creator profile in three quick steps to get verified and unlock brand collaborations, campaign invitations and PR opportunities.",
    heading: "Register as a Creator and Get Verified",
    indexable: true,
    priority: "0.9",
    changefreq: "monthly"
  },
  {
    tab: "membership",
    path: "/membership/",
    title: "Creator Membership Plans & Pricing | FSIA Influencer",
    description:
      "Compare free and premium creator membership plans: verification badges, priority brand matching, portfolio shoots and dedicated talent management.",
    heading: "Creator Membership Plans",
    indexable: true,
    priority: "0.7",
    changefreq: "monthly"
  },
  {
    tab: "faq",
    path: "/faq/",
    title: "Creator & Brand FAQs | FSIA Influencer",
    description:
      "Answers about creator verification, payments, GST, campaign eligibility and how brands work with influencers on FSIA Influencer.",
    heading: "Frequently Asked Questions",
    indexable: true,
    priority: "0.6",
    changefreq: "monthly"
  },
  {
    tab: "admin",
    path: "/admin/",
    title: "Admin | FSIA Influencer",
    description: "Administration workspace.",
    heading: "Admin",
    indexable: false,
    priority: "0",
    changefreq: "monthly"
  }
];

// ----------------------------------------------------
// Admin-editable overrides
// ----------------------------------------------------
export interface SeoSite {
  siteName?: string;
  defaultImage?: string;
  googleVerification?: string;
  /** false = ask search engines not to index anything (staging / not ready yet) */
  allowIndexing?: boolean;
}

export interface SeoPageOverride {
  title?: string;
  description?: string;
  image?: string;
  noindex?: boolean;
}

export interface SeoConfig {
  site: SeoSite;
  pages: Record<string, SeoPageOverride>;
}

export interface CreatorSeo {
  slug?: string;
  title?: string;
  description?: string;
  noindex?: boolean;
}

export interface SeoCreator {
  name: string;
  role?: string;
  city?: string;
  bio?: string;
  image?: string;
  seo?: CreatorSeo;
}

export interface SeoSection {
  id: string;
  title: string;
  creators: SeoCreator[];
}

export const EMPTY_SEO: SeoConfig = { site: {}, pages: {} };

export const LIMITS = { title: 60, description: 160 };

const clean = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export const routeForTab = (tab: TabId): RouteMeta => ROUTES.find((r) => r.tab === tab) || ROUTES[0];

export const PROFILE_PREFIX = "/talent/";

export function normalisePath(pathname: string): string {
  const trimmed = pathname.replace(/index\.html$/, "").replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}/` : "/";
}

/** Slug from the profile path (/talent/<slug>/), or null for normal pages */
export function profileSlugFromPath(pathname: string): string | null {
  const path = normalisePath(pathname);
  const m = path.match(/^\/talent\/([a-z0-9-]+)\/$/);
  return m ? m[1] : null;
}

export function routeForPath(pathname: string): RouteMeta {
  const path = normalisePath(pathname);
  if (profileSlugFromPath(path)) return routeForTab("directory");
  return ROUTES.find((r) => r.path === path) || ROUTES[0];
}

export const isKnownPath = (pathname: string) => {
  const path = normalisePath(pathname);
  return ROUTES.some((r) => r.path === path);
};

// ----------------------------------------------------
// Creator profile URLs
// ----------------------------------------------------
export function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export interface ProfileEntry {
  slug: string;
  path: string;
  section: SeoSection;
  creator: SeoCreator;
}

/** Stable, unique slug for every creator (custom slug → name → name-section → -2, -3 …) */
export function assignProfileSlugs(sections: SeoSection[]): ProfileEntry[] {
  const used = new Set<string>();
  const entries: ProfileEntry[] = [];
  for (const section of sections || []) {
    for (const creator of section.creators || []) {
      let base = slugify(clean(creator.seo?.slug)) || slugify(clean(creator.name)) || "creator";
      let slug = base;
      if (used.has(slug)) slug = `${base}-${slugify(section.id)}`;
      for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
      used.add(slug);
      entries.push({ slug, path: `${PROFILE_PREFIX}${slug}/`, section, creator });
    }
  }
  return entries;
}

// ----------------------------------------------------
// Resolution: defaults + admin overrides → final tags
// ----------------------------------------------------
export interface ResolvedMeta {
  path: string;
  canonical: string;
  title: string;
  description: string;
  image: string;
  imageIsDefault: boolean;
  indexable: boolean;
  heading: string;
  jsonLd: object[];
  bodyHtml: string;
}

export const siteName = (seo: SeoConfig) => clean(seo.site?.siteName) || SITE_NAME;
export const defaultImage = (seo: SeoConfig) => {
  const img = clean(seo.site?.defaultImage);
  return /^https?:\/\//i.test(img) ? img : OG_IMAGE;
};
const siteIndexable = (seo: SeoConfig) => seo.site?.allowIndexing !== false;

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function truncate(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return (space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:—-]+$/, "") + "…";
}

function baseGraph(seo: SeoConfig, canonical: string, title: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: siteName(seo),
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/logo.png`
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: siteName(seo),
        url: `${SITE_URL}/`,
        inLanguage: "en-IN",
        publisher: { "@id": `${SITE_URL}/#organization` }
      },
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: title,
        description,
        isPartOf: { "@id": `${SITE_URL}/#website` }
      }
    ]
  };
}

const navLinks = () =>
  ROUTES.filter((r) => r.indexable)
    .map((r) => `<a href="${r.path}">${escapeHtml(r.heading)}</a>`)
    .join(" · ");

export function resolvePageMeta(route: RouteMeta, seo: SeoConfig = EMPTY_SEO, profiles: ProfileEntry[] = []): ResolvedMeta {
  const o = seo.pages?.[route.path] || {};
  const canonical = SITE_URL + route.path;
  const title = clean(o.title) || route.title;
  const description = clean(o.description) || route.description;
  const custom = clean(o.image);
  const image = /^https?:\/\//i.test(custom) ? custom : defaultImage(seo);
  const jsonLd: object[] = [baseGraph(seo, canonical, title, description)];
  let extra = "";
  if (route.tab === "faq") {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } }))
    });
    extra = FAQS.map((f) => `<h2>${escapeHtml(f.question)}</h2><p>${escapeHtml(f.answer)}</p>`).join("");
  }
  if (route.tab === "directory") {
    const listed = profiles.filter((p) => !p.creator.seo?.noindex);
    if (listed.length) {
      extra = `<ul>${listed
        .map((p) => `<li><a href="${p.path}">${escapeHtml(p.creator.name)}</a>${p.creator.role ? ` — ${escapeHtml(p.creator.role)}` : ""}</li>`)
        .join("")}</ul>`;
    }
  }
  return {
    path: route.path,
    canonical,
    title,
    description,
    image,
    imageIsDefault: image === defaultImage(seo),
    indexable: siteIndexable(seo) && route.indexable && !o.noindex,
    heading: route.heading,
    jsonLd,
    bodyHtml: `<main class="seo-fallback"><h1>${escapeHtml(route.heading)}</h1><p>${escapeHtml(description)}</p>${extra}<nav aria-label="Site">${navLinks()}</nav></main>`
  };
}

export function defaultProfileTitle(entry: ProfileEntry, seo: SeoConfig = EMPTY_SEO) {
  // First option that fits Google's ~60 characters:
  // "Name — Full role | Site" → "Name — Full role" → "Name — Role (first part) | Site" → "Name | Site"
  const name = clean(entry.creator.name);
  const role = clean(entry.creator.role);
  const short = role.split(",")[0].trim();
  const site = siteName(seo);
  const options = [
    role && `${name} — ${role} | ${site}`,
    role && `${name} — ${role}`,
    short && `${name} — ${short} | ${site}`,
    `${name} | ${site}`
  ].filter(Boolean) as string[];
  return options.find((t) => t.length <= LIMITS.title) || truncate(options[options.length - 1], LIMITS.title);
}

export function defaultProfileDescription(entry: ProfileEntry) {
  const c = entry.creator;
  const lead = [clean(c.role), clean(c.city)].filter(Boolean).join(", ");
  const text = clean(c.bio) || `${clean(c.name)} is a verified creator in ${entry.section.title}.`;
  return truncate(lead ? `${lead}. ${text}` : text, 160);
}

/** Public link to a creator's photo. Uploaded photos are stored inside the profile, so the server
 *  serves them at /api/media/profile/<slug>.jpg for Google, WhatsApp and social previews. */
export function profilePhotoUrl(entry: ProfileEntry): string {
  const photo = clean(entry.creator.image);
  if (/^https?:\/\//i.test(photo)) return photo;
  if (/^data:image\/(jpeg|png|webp);base64,/i.test(photo)) return `${SITE_URL}/api/media/profile/${entry.slug}.jpg?v=${photo.length}`;
  return "";
}

export function resolveProfileMeta(entry: ProfileEntry, seo: SeoConfig = EMPTY_SEO): ResolvedMeta {
  const c = entry.creator;
  const canonical = SITE_URL + entry.path;
  const title = clean(c.seo?.title) || defaultProfileTitle(entry, seo);
  const description = clean(c.seo?.description) || defaultProfileDescription(entry);
  const photo = profilePhotoUrl(entry);
  const image = photo || defaultImage(seo);
  const person: Record<string, unknown> = {
    "@type": "Person",
    name: clean(c.name),
    url: canonical,
    description: clean(c.bio) || description,
    ...(clean(c.role) ? { jobTitle: clean(c.role) } : {}),
    ...(photo ? { image: photo } : {}),
    ...(clean(c.city) ? { address: { "@type": "PostalAddress", addressLocality: clean(c.city), addressCountry: "IN" } } : {})
  };
  const graph = baseGraph(seo, canonical, title, description) as { "@graph": object[] };
  graph["@graph"].push({ "@type": "ProfilePage", "@id": `${canonical}#profile`, url: canonical, mainEntity: person });
  return {
    path: entry.path,
    canonical,
    title,
    description,
    image,
    imageIsDefault: image === defaultImage(seo),
    indexable: siteIndexable(seo) && !c.seo?.noindex,
    heading: clean(c.name),
    jsonLd: [graph],
    bodyHtml:
      `<main class="seo-fallback"><h1>${escapeHtml(clean(c.name))}</h1>` +
      `<p>${escapeHtml([clean(c.role), clean(c.city), entry.section.title].filter(Boolean).join(" · "))}</p>` +
      `<p>${escapeHtml(clean(c.bio) || description)}</p>` +
      `<p><a href="${PROFILE_PREFIX}">Browse all creators</a></p><nav aria-label="Site">${navLinks()}</nav></main>`
  };
}

/** Meta for a not-found address (kept out of search results) */
export function notFoundMeta(pathname: string, seo: SeoConfig = EMPTY_SEO): ResolvedMeta {
  const home = resolvePageMeta(ROUTES[0], seo);
  return {
    ...home,
    path: normalisePath(pathname),
    title: `Page not found | ${siteName(seo)}`,
    indexable: false,
    bodyHtml: `<main class="seo-fallback"><h1>Page not found</h1><p>This page does not exist.</p><nav aria-label="Site">${navLinks()}</nav></main>`
  };
}

/** Everything that goes between the SEO markers in index.html */
export function renderHead(meta: ResolvedMeta, seo: SeoConfig = EMPTY_SEO): string {
  const t = escapeHtml(meta.title);
  const d = escapeHtml(meta.description);
  const gsc = clean(seo.site?.googleVerification).replace(/[^A-Za-z0-9_\-]/g, "");
  return [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" />`,
    `<meta name="robots" content="${meta.indexable ? "index, follow, max-image-preview:large" : "noindex, nofollow"}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`,
    ...(gsc ? [`<meta name="google-site-verification" content="${gsc}" />`] : []),
    `<meta property="og:type" content="${meta.path.startsWith(PROFILE_PREFIX) && meta.path !== PROFILE_PREFIX ? "profile" : "website"}" />`,
    `<meta property="og:site_name" content="${escapeHtml(siteName(seo))}" />`,
    `<meta property="og:locale" content="en_IN" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(meta.image)}" />`,
    ...(meta.image === OG_IMAGE ? [`<meta property="og:image:width" content="1200" />`, `<meta property="og:image:height" content="630" />`] : []),
    `<meta property="og:image:alt" content="${t}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${escapeHtml(meta.image)}" />`,
    ...meta.jsonLd.map((block) => `<script type="application/ld+json">${JSON.stringify(block).replace(/</g, "\\u003c")}</script>`)
  ].join("\n    ");
}

export const renderBody = (meta: ResolvedMeta) => meta.bodyHtml;

/** sitemap.xml for every indexable page and profile */
export function renderSitemap(seo: SeoConfig, profiles: ProfileEntry[], lastmod: string): string {
  if (!siteIndexable(seo)) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n`;
  }
  const rows: string[] = [];
  for (const r of ROUTES) {
    if (!r.indexable || seo.pages?.[r.path]?.noindex) continue;
    rows.push(`  <url>\n    <loc>${SITE_URL}${r.path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`);
  }
  for (const p of profiles) {
    if (p.creator.seo?.noindex) continue;
    rows.push(`  <url>\n    <loc>${SITE_URL}${p.path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</urlset>\n`;
}

export function renderRobots(seo: SeoConfig): string {
  if (!siteIndexable(seo)) return `User-agent: *\nDisallow: /\n`;
  return `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
}

/** Browser: keep <head> in sync with the section or profile on screen */
export function applyMeta(meta: ResolvedMeta) {
  if (typeof document === "undefined") return;
  document.title = meta.title;
  const set = (selector: string, attr: string, value: string) => {
    document.querySelectorAll(selector).forEach((el) => el.setAttribute(attr, value));
  };
  set('meta[name="description"]', "content", meta.description);
  set('meta[name="robots"]', "content", meta.indexable ? "index, follow, max-image-preview:large" : "noindex, nofollow");
  set('link[rel="canonical"]', "href", meta.canonical);
  set('meta[property="og:title"], meta[name="twitter:title"], meta[property="og:image:alt"]', "content", meta.title);
  set('meta[property="og:description"], meta[name="twitter:description"]', "content", meta.description);
  set('meta[property="og:url"]', "content", meta.canonical);
  set('meta[property="og:image"], meta[name="twitter:image"]', "content", meta.image);
}
