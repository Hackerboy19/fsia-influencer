// Content for the award agency home page, Star India and Green Light.
// Kept here (not inside components) so copy can be edited in one place.

import { AWARD_NAME } from "./brand";

// There is one award. It is separate from FSIA, and separate from joining the platform:
// any creator can join and get a profile, with or without the award.
export { AWARD_NAME };

export const AWARD = {
  name: AWARD_NAME,
  tagline: "India's award for influencers and digital creators",
  text: "A separate award, open to creators in every niche. The jury looks at the quality of the work, the audience and its impact. You do not need the award to join the platform: any creator can create a profile."
} as const;

// Creator niches that can apply (these are not separate award categories)
export const ELIGIBLE_NICHES = [
  "Fashion & Style",
  "Beauty & Makeup",
  "Travel",
  "Food & Cooking",
  "Fitness & Health",
  "Comedy & Entertainment",
  "Technology & Gadgets",
  "Pageants & Modelling",
  "Social Impact",
  "Finance & Business"
] as const;

export const AWARD_PERKS = [
  { title: "The award on your profile", text: "Winners have the award shown on their public profile." },
  { title: "Branding & marketing", text: "Endorsement representation and digital marketing support." },
  { title: "Brand introductions", text: "Direct introductions when a brand brief fits your niche." }
] as const;

export const VALUE_FLOW = [
  {
    step: 1,
    title: "Join the Platform",
    text: `Any creator can join and get a profile. The ${AWARD_NAME} is separate.`
  },
  {
    step: 2,
    title: "Receive Branding & Marketing Support",
    text: "Members get endorsement representation, digital marketing and a dedicated profile page."
  },
  {
    step: 3,
    title: "Connect with Brands for Business Deals",
    text: "Our team acts as the bridge between creators and brands for direct business collaborations."
  }
] as const;

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: "For Creators" | "For Brands" | "Awards";
  readMinutes: number;
  body: string[];
}

// Evergreen guides; no dated news, so nothing here goes stale or claims events that did not happen
export const BLOG_POSTS: BlogPost[] = [
  {
    id: "how-to-apply-for-an-influencer-award",
    title: `How to apply for the ${AWARD_NAME}`,
    excerpt: "What the jury looks at and how to present your work.",
    category: "Awards",
    readMinutes: 4,
    body: [
      "Tell the jury which niche most of your content sits in. A focused application is easier to judge than one spread across many topics.",
      "Show results, not just follower counts: engagement, audience feedback, campaigns you have run and anything you have built off-platform.",
      "Keep your profile links public and up to date. The team reviews your Instagram or YouTube directly before shortlisting."
    ]
  },
  {
    id: "media-kit-brands-trust",
    title: "Building a media kit brands trust",
    excerpt: "The five things every brand manager checks before replying to a creator.",
    category: "For Creators",
    readMinutes: 5,
    body: [
      "Lead with who your audience is: age range, top cities and what they come to you for.",
      "Add two or three past collaborations with the brief, what you delivered and how it performed.",
      "List clear deliverables and turnaround times. Brands reply faster when they can see exactly what they are buying."
    ]
  },
  {
    id: "from-award-to-brand-deal",
    title: "From award to brand deal: what happens next",
    excerpt: "What changes after you win, and how brand introductions work.",
    category: "Awards",
    readMinutes: 3,
    body: [
      `Winners of the ${AWARD_NAME} have the award shown on their public profile, which brands can browse.`,
      "The branding team helps refresh your bio, portfolio and media kit so they match the award.",
      "When a brand brief fits your category and city, the team introduces you directly and helps with the contract."
    ]
  },
  {
    id: "asci-disclosure-basics",
    title: "ASCI disclosure basics for creators",
    excerpt: "When and how to label paid, gifted and affiliate posts in India.",
    category: "For Creators",
    readMinutes: 4,
    body: [
      "Any post where you received money, free products or other benefits from a brand needs a clear label such as #ad, #collab or #sponsored.",
      "Put the label where people see it first: at the start of the caption or on the video itself, not hidden among hashtags.",
      "Brands share the responsibility, so expect agencies to ask you to follow these rules in every brief."
    ]
  },
  {
    id: "hiring-awarded-influencers",
    title: "Why brands hire awarded influencers",
    excerpt: "Shortlisting faster with creators who are already reviewed and verified.",
    category: "For Brands",
    readMinutes: 3,
    body: [
      "Awarded creators have already been reviewed by our team, which saves you a first round of screening.",
      "Profiles list category and city, plus the audience figures each creator supplied, which makes a first shortlist quicker.",
      "Send a brand enquiry and the team suggests creators who match your brief and budget."
    ]
  }
];

export const MAGAZINE_PACKAGES = [
  { id: "cover", title: "Cover Story", text: "Your portrait on the cover of Explore Magazine with a long-form interview inside." },
  { id: "feature", title: "Inside Feature", text: "A two-page feature with photos and your story." },
  { id: "spotlight", title: "Digital Spotlight", text: "An online profile feature shared on our social channels." }
] as const;

export const CONTACT_TOPICS = [
  "Awards & applications",
  "Star India membership",
  "Magazine booking",
  "Brand deals",
  "Profile correction or removal",
  "Something else"
] as const;

/** Short, stable member number shown on Influencer ID cards (derived from the name, not stored) */
export function influencerId(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return `FSIA-${String(hash % 100000).padStart(5, "0")}`;
}

/** "2.4M" / "850K" / "12,000" → number of followers (0 when unreadable) */
export function parseReach(value: unknown): number {
  const m = String(value ?? "").replace(/,/g, "").trim().match(/^(\d+(?:\.\d+)?)\s*([kKmMbB])?/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const unit = (m[2] || "").toLowerCase();
  return Math.round(n * (unit === "b" ? 1e9 : unit === "m" ? 1e6 : unit === "k" ? 1e3 : 1));
}

/** 8830000 → "8.8M" */
export function formatReach(n: number): string {
  if (n >= 1e9) return `${+(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${+(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}K`;
  return String(n);
}
