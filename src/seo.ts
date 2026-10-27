// Single source of truth for URLs, titles and descriptions.
// Used in the browser (updates <head> on navigation) and at build time by
// scripts/prerender-seo.ts, which writes one static HTML file per route plus
// robots.txt and sitemap.xml so crawlers see complete metadata without JavaScript.
import { FAQS } from "./content/faqs";
import { AWARD_NAME, BRAND_NAME } from "./content/brand";
import { ORGANISER } from "./content/organiser";

export const SITE_URL = "https://influencer.fsia.in";
export const SITE_NAME = BRAND_NAME;
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

export type TabId =
  | "home"
  | "catwalk"
  | "directory"
  | "campaigns"
  | "membership"
  | "apply"
  | "starindia"
  | "greenlight"
  | "faq"
  | "contact"
  | "privacy"
  | "admin";

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
    tab: "home",
    path: "/",
    title: `Influencer Award & Creator Profiles in India | ${SITE_NAME}`,
    description:
      `Browse reviewed profiles of Indian influencers, apply for the ${AWARD_NAME} to join, and send brand collaboration enquiries to our team.`,
    heading: "Indian influencer profiles, reviewed before they are published",
    intro:
      `${SITE_NAME} is a creator directory for India. Creators join by applying for the ${AWARD_NAME}: once our team approves the application, they get a public profile with their category, city and work. After the awards, the platform opens to every creator. Brands browse those profiles, see open campaigns and send collaboration enquiries, which our team follows up directly.`,
    indexable: true,
    priority: "1.0",
    changefreq: "weekly"
  },
  {
    tab: "catwalk",
    path: "/gallery/",
    title: `3D Profile Gallery | ${SITE_NAME}`,
    description:
      "An interactive 3D gallery of published creator profiles. Move between sections and open any profile.",
    heading: "3D profile gallery",
    intro:
      "An interactive 3D view of the published creator profiles. Move between sections with the arrows and open a portrait to see the profile and work.",
    indexable: true,
    priority: "0.6",
    changefreq: "weekly"
  },
  {
    tab: "directory",
    path: "/talent/",
    title: `Hire Influencers in India: Creator Profiles | ${SITE_NAME}`,
    description:
      "Search reviewed Indian influencer profiles by name, category and city, open a profile to see their work, and send a brand collaboration enquiry.",
    heading: "Creator profiles",
    intro:
      "Every profile here was submitted by the creator and approved by our team before publishing. Search by name, category or city, open a profile, and send an enquiry to hire influencers for your campaign.",
    indexable: true,
    priority: "0.9",
    changefreq: "daily"
  },
  {
    tab: "campaigns",
    path: "/campaigns/",
    title: `Paid Brand Collaborations for Influencers | ${SITE_NAME}`,
    description:
      "Open brand collaborations for Instagram and YouTube creators in India. Each listing shows the budget, deliverables and who can apply.",
    heading: "Open brand campaigns",
    intro:
      "Paid and barter collaborations for Instagram and YouTube creators in India. Each listing shows its budget, deliverables and eligibility. Applications go to our team, who pass shortlisted creators to the brand.",
    indexable: true,
    priority: "0.9",
    changefreq: "daily"
  },
  {
    tab: "apply",
    path: "/join/",
    title: `${AWARD_NAME} Application & Registration | ${SITE_NAME}`,
    description:
      `Apply for the ${AWARD_NAME} to join and get a public profile. A free, three-step form; our team reviews every application.`,
    heading: `Apply for the ${AWARD_NAME}`,
    intro:
      `Creators join by applying for the ${AWARD_NAME}; after the awards, the platform opens to every creator. Applying is free and takes about two minutes. Tell us your category, city and audience on Instagram or YouTube. Our team reviews each application; approved creators get a public profile that brands can browse, and can apply for paid brand collaborations. Creators in fashion, beauty, food, travel, tech, gaming and other niches are welcome from anywhere in India.`,
    indexable: true,
    priority: "0.9",
    changefreq: "monthly"
  },
  {
    tab: "membership",
    path: "/membership/",
    title: `Creator Membership Plans & Pricing | ${SITE_NAME}`,
    description:
      "Compare the free and paid creator membership plans, what each includes and how to request one.",
    heading: "Membership plans",
    intro:
      "Compare the free and paid membership plans for creators. Choose a plan to send a request; our team replies with next steps and payment details.",
    indexable: true,
    priority: "0.7",
    changefreq: "monthly"
  },
  {
    tab: "starindia",
    path: "/star-india/",
    title: `Star India Membership & Influencer Profiles | ${SITE_NAME}`,
    description:
      "Star India is the creator membership: a public profile, branding support and introductions to brands.",
    heading: "Star India members",
    intro:
      "Star India is the creator membership. Members get a public profile with their work, help with branding and marketing, and introductions when a brand brief fits their niche.",
    indexable: true,
    priority: "0.8",
    changefreq: "weekly"
  },
  {
    tab: "greenlight",
    path: "/green-light/",
    title: `Green Light Guides & Explore Magazine | ${SITE_NAME}`,
    description:
      "Practical guides for Indian creators and brands, and bookings for Explore Magazine covers, features and digital spotlights.",
    heading: "Green Light: guides and Explore Magazine",
    intro:
      "Green Light publishes practical guides for creators and brands and handles bookings for Explore Magazine: cover stories, inside features and digital spotlights.",
    indexable: true,
    priority: "0.7",
    changefreq: "weekly"
  },
  {
    tab: "faq",
    path: "/faq/",
    title: `Influencer FAQs: GST, ASCI & Payments | ${SITE_NAME}`,
    description:
      "Answers for influencers and brands in India: registration, what the Reviewed mark means, GST, ASCI disclosure rules and pricing.",
    heading: "Questions and answers",
    intro:
      "How registration and profile review work, what the Reviewed mark means, GST and payments, ASCI disclosure rules and pricing a collaboration.",
    indexable: true,
    priority: "0.6",
    changefreq: "monthly"
  },
  {
    tab: "contact",
    path: "/contact/",
    title: `Contact ${SITE_NAME} | Support & Enquiries`,
    description:
      `Write to the ${SITE_NAME} team about the award, membership, magazine bookings, brand deals or a correction to a profile. We reply by email.`,
    heading: "Contact us",
    intro:
      "Write to us about the award, membership, a magazine booking, a brand deal or a correction to a profile. We reply by email.",
    indexable: true,
    priority: "0.5",
    changefreq: "monthly"
  },
  {
    tab: "privacy",
    path: "/privacy/",
    title: `Privacy Notice | ${SITE_NAME}`,
    description:
      `What personal information ${SITE_NAME} collects through its forms, what is published on profiles, and how to correct or remove your data.`,
    heading: "Privacy notice",
    intro:
      "What we collect when you apply or write to us, what appears on a public profile, and how to have your information corrected or removed.",
    indexable: true,
    priority: "0.3",
    changefreq: "monthly"
  },
  {
    tab: "admin",
    path: "/admin/",
    title: `Admin | ${SITE_NAME}`,
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
    logo: `${SITE_URL}/logo.png`,
    email: ORGANISER.email,
    telephone: ORGANISER.phoneHref.replace("tel:", ""),
    address: { "@type": "PostalAddress", addressLocality: ORGANISER.locality, addressRegion: ORGANISER.region, addressCountry: ORGANISER.country }
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
