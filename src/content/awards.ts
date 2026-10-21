// Content for the award agency home page, Star India and Green Light.
// Kept here (not inside components) so copy can be edited in one place.

export interface AwardCategory {
  id: string;
  title: string;
  blurb: string;
  // Creator registration category this award maps to (see creatorCategories.ts)
  creatorCategory?: string;
}

// Category awards open to every creator niche
export const TRADITIONAL_AWARDS: AwardCategory[] = [
  { id: "fashion", title: "Best Fashion Influencer", blurb: "Style, couture and street fashion creators.", creatorCategory: "Fashion & Style" },
  { id: "beauty", title: "Best Beauty Influencer", blurb: "Makeup, skincare and grooming voices.", creatorCategory: "Beauty & Makeup" },
  { id: "travel", title: "Best Travel Creator", blurb: "Travel stories from India and beyond.", creatorCategory: "Travel" },
  { id: "food", title: "Best Food Creator", blurb: "Recipes, reviews and regional food.", creatorCategory: "Food & Cooking" },
  { id: "fitness", title: "Best Fitness Influencer", blurb: "Training, sport and healthy living.", creatorCategory: "Fitness & Health" },
  { id: "comedy", title: "Best Comedy Creator", blurb: "Sketches, satire and entertainment.", creatorCategory: "Comedy & Entertainment" },
  { id: "tech", title: "Best Tech Creator", blurb: "Gadgets, apps and explainers.", creatorCategory: "Technology & Gadgets" },
  { id: "pageant", title: "Best Model & Pageant Star", blurb: "Runway, pageant and modelling talent.", creatorCategory: "Pageants & Modelling" }
];

// Top honours, judged across all niches
export const PREMIUM_AWARDS: AwardCategory[] = [
  { id: "influencer-of-the-year", title: "Influencer of the Year", blurb: "The creator with the strongest year across reach, impact and craft." },
  { id: "celebrity-influencer", title: "Celebrity Influencer Award", blurb: "Public figures who lead online conversations." },
  { id: "rising-star", title: "Rising Star of India", blurb: "Fast-growing creators to watch next year." },
  { id: "social-impact", title: "Social Impact Champion", blurb: "Creators who use their platform for change.", creatorCategory: "Social Impact" },
  { id: "entrepreneur", title: "Creator Entrepreneur Award", blurb: "Creators who built a brand or business." , creatorCategory: "Finance & Business" },
  { id: "brand-ambassador", title: "Brand Ambassador of the Year", blurb: "The most trusted long-term brand partner." }
];

export const VALUE_FLOW = [
  {
    step: 1,
    title: "Apply for Award & Become a Member",
    text: "Register for the influencer awards. Recognised applicants enter the FSIA ecosystem as Star India members."
  },
  {
    step: 2,
    title: "Receive Branding & Marketing Support",
    text: "Awardees get endorsement representation, digital marketing and a dedicated profile page."
  },
  {
    step: 3,
    title: "Connect with Brands for Business Deals",
    text: "FSIA acts as the bridge between awarded influencers and brands for direct business collaborations."
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
    title: "How to apply for an influencer award",
    excerpt: "What the jury looks at, which category to pick and how to present your work.",
    category: "Awards",
    readMinutes: 4,
    body: [
      "Pick the category where most of your content sits. A focused application is easier for the jury to judge than one spread across niches.",
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
    excerpt: "How the FSIA team turns recognition into paid collaborations.",
    category: "Awards",
    readMinutes: 3,
    body: [
      "Awardees join Star India and get an Influencer ID profile that brands can browse.",
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
      "Awarded creators have already been reviewed by the FSIA team, so you skip the first round of vetting.",
      "Every Star India profile lists category, city, reach and engagement, which makes shortlisting quicker.",
      "Send a brand enquiry and the team suggests creators who match your brief and budget."
    ]
  }
];

export const MAGAZINE_PACKAGES = [
  { id: "cover", title: "Cover Story", text: "Your portrait on the cover of Explore Magazine with a long-form interview inside." },
  { id: "feature", title: "Inside Feature", text: "A two-page feature with photos, your story and your award." },
  { id: "spotlight", title: "Digital Spotlight", text: "An online profile feature shared across FSIA social channels." }
] as const;

export const CONTACT_TOPICS = ["Awards & applications", "Star India membership", "Magazine booking", "Brand deals", "Something else"] as const;

/** Short, stable member number shown on Influencer ID cards (derived from the name, not stored) */
export function influencerId(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return `FSIA-${String(hash % 100000).padStart(5, "0")}`;
}
