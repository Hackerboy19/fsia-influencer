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
  // Plain-language summary shown on the page and in the crawlable fallback
  intro: string;
  indexable: boolean;
  priority: string;
  changefreq: "daily" | "weekly" | "monthly";
}

export const ROUTES: RouteMeta[] = [
  {
    tab: "catwalk",
    path: "/",
    title: "FSIA Influencer – Verified Creators & Brand Deals in India",
    description:
      "Creator and influencer platform for India: get verified, apply for paid brand collaborations on Instagram and YouTube, or hire verified influencers.",
    heading: "Verified Creators & Brand Collaborations in India",
    intro:
      "FSIA Influencer is a creator and influencer platform for India. Instagram and YouTube creators register for free, get verified and apply for paid brand collaborations and barter campaigns. Brands use it to find and hire verified influencers by category and city, from fashion, beauty and pageants to travel, food, tech and gaming, and to run influencer marketing campaigns with creators across the country.",
    indexable: true,
    priority: "1.0",
    changefreq: "weekly"
  },
  {
    tab: "directory",
    path: "/talent/",
    title: "Hire Verified Influencers in India | FSIA Influencer",
    description:
      "Find and hire verified Indian influencers and creators by category, city, reach and engagement, then send a brand collaboration request in minutes.",
    heading: "Find and Hire Verified Influencers in India",
    intro:
      "Browse verified influencers and creators from across India. Filter by category, city, reach and engagement, open a profile to see their work, and send a brand collaboration request. Every creator listed here has been reviewed and approved by the FSIA team.",
    indexable: true,
    priority: "0.9",
    changefreq: "daily"
  },
  {
    tab: "campaigns",
    path: "/campaigns/",
    title: "Paid Brand Collaborations for Influencers | FSIA Influencer",
    description:
      "Apply for paid brand collaborations and barter campaigns for Instagram and YouTube creators in India, across fashion, beauty, travel, lifestyle and tech.",
    heading: "Paid Brand Campaigns for Influencers",
    intro:
      "Paid brand collaborations and barter campaigns for Instagram and YouTube creators in India. Each campaign lists its budget, deliverables and eligibility, and micro influencers are welcome to apply.",
    indexable: true,
    priority: "0.9",
    changefreq: "daily"
  },
  {
    tab: "apply",
    path: "/join/",
    title: "Influencer Registration in India | FSIA Influencer",
    description:
      "Register as an influencer in India in three quick steps. Get verified and unlock paid brand collaborations, campaign invitations and PR opportunities.",
    heading: "Register as an Influencer and Get Verified",
    intro:
      "Influencer registration takes about two minutes and is free. Tell us your category, city and audience on Instagram or YouTube, and our team reviews your profile. Once verified, you can apply for paid brand collaborations, receive campaign invitations and be listed for brands looking to hire influencers. Models, pageant contestants and creators in beauty, food, travel, tech, gaming and more are welcome from anywhere in India.",
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
    intro:
      "Compare free and premium membership plans for influencers in India: verification badges, priority brand matching, portfolio shoots and talent management.",
    indexable: true,
    priority: "0.7",
    changefreq: "monthly"
  },
  {
    tab: "faq",
    path: "/faq/",
    title: "Influencer FAQs: GST, ASCI & Payments | FSIA Influencer",
    description:
      "Answers for influencers and brands in India: registration, verification, GST, ASCI disclosure rules, payments and how brand collaborations work.",
    heading: "Influencer & Brand FAQs",
    intro:
      "Answers for creators and brands on influencer registration, verification, GST and payments, ASCI disclosure rules and how brand collaborations work.",
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
    intro: "",
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

export const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// JSON-LD blocks: Organization + WebSite + WebPage everywhere, BreadcrumbList on section
// pages, FAQPage on /faq/. Only facts the site itself shows; no ratings or invented details.
// (Creator profiles open as overlays on /talent/, not as their own URLs, so ProfilePage /
// Person markup does not apply.)
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
          inLanguage: "en-IN",
          isPartOf: { "@id": `${SITE_URL}/#website` },
          primaryImageOfPage: { "@type": "ImageObject", url: OG_IMAGE, width: 1200, height: 630 },
          ...(route.path !== "/" ? { breadcrumb: { "@id": `${canonicalUrl(route)}#breadcrumb` } } : {})
        },
        ...(route.path !== "/"
          ? [
              {
                "@type": "BreadcrumbList",
                "@id": `${canonicalUrl(route)}#breadcrumb`,
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
                  { "@type": "ListItem", position: 2, name: route.heading, item: canonicalUrl(route) }
                ]
              }
            ]
          : [])
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
  return `<main class="seo-fallback"><h1>${escapeHtml(route.heading)}</h1><p>${escapeHtml(route.intro || route.description)}</p>${faq}<nav aria-label="Site">${links}</nav></main>`;
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
