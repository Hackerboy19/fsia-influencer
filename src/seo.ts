// Single source of truth for URLs, titles and descriptions.
// Used in the browser (updates <head> on navigation) and at build time by
// scripts/prerender-seo.ts, which writes one static HTML file per route plus
// robots.txt and sitemap.xml so crawlers see complete metadata without JavaScript.
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

export const routeForTab = (tab: TabId): RouteMeta => ROUTES.find((r) => r.tab === tab) || ROUTES[0];

export function routeForPath(pathname: string): RouteMeta {
  const normalised = ("/" + pathname.replace(/^\/+|\/+$/g, "") + "/").replace(/^\/\/$/, "/");
  return ROUTES.find((r) => r.path === normalised) || ROUTES[0];
}

export const canonicalUrl = (route: RouteMeta) => SITE_URL + route.path;

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// JSON-LD blocks: WebSite + Organization everywhere, FAQPage on /faq/
export function structuredData(route: RouteMeta): object[] {
  const organization = {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/logo.png`
  };
  const blocks: object[] = [
    {
      "@context": "https://schema.org",
      "@graph": [
        organization,
        {
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          name: SITE_NAME,
          url: `${SITE_URL}/`,
          inLanguage: "en-IN",
          publisher: { "@id": `${SITE_URL}/#organization` }
        },
        {
          "@type": "WebPage",
          "@id": `${canonicalUrl(route)}#webpage`,
          url: canonicalUrl(route),
          name: route.title,
          description: route.description,
          isPartOf: { "@id": `${SITE_URL}/#website` }
        }
      ]
    }
  ];
  if (route.tab === "faq") {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer }
      }))
    });
  }
  return blocks;
}

// <head> tags for a route (between the SEO markers in index.html)
export function renderHead(route: RouteMeta): string {
  const url = canonicalUrl(route);
  const t = escapeHtml(route.title);
  const d = escapeHtml(route.description);
  return [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" />`,
    `<meta name="robots" content="${route.indexable ? "index, follow, max-image-preview:large" : "noindex, nofollow"}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="en_IN" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${SITE_NAME} — creators and brand collaborations" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
    ...structuredData(route).map(
      (block) => `<script type="application/ld+json">${JSON.stringify(block).replace(/</g, "\\u003c")}</script>`
    )
  ].join("\n    ");
}

// Crawlable fallback content inside #root; React replaces it on load
export function renderBody(route: RouteMeta): string {
  const links = ROUTES.filter((r) => r.indexable)
    .map((r) => `<a href="${r.path}">${escapeHtml(r.heading)}</a>`)
    .join(" · ");
  const faq =
    route.tab === "faq"
      ? FAQS.map((f) => `<h2>${escapeHtml(f.question)}</h2><p>${escapeHtml(f.answer)}</p>`).join("")
      : "";
  return `<main class="seo-fallback"><h1>${escapeHtml(route.heading)}</h1><p>${escapeHtml(route.description)}</p>${faq}<nav aria-label="Site">${links}</nav></main>`;
}

// Browser: keep <head> in sync with the active section
export function applyRouteMeta(route: RouteMeta) {
  if (typeof document === "undefined") return;
  document.title = route.title;
  const set = (selector: string, attr: string, value: string) => {
    document.querySelectorAll(selector).forEach((el) => el.setAttribute(attr, value));
  };
  const url = canonicalUrl(route);
  set('meta[name="description"]', "content", route.description);
  set('meta[name="robots"]', "content", route.indexable ? "index, follow, max-image-preview:large" : "noindex, nofollow");
  set('link[rel="canonical"]', "href", url);
  set('meta[property="og:title"], meta[name="twitter:title"]', "content", route.title);
  set('meta[property="og:description"], meta[name="twitter:description"]', "content", route.description);
  set('meta[property="og:url"]', "content", url);
}
