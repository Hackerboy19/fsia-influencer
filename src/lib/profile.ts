import type { Creator } from "../data";

// Text that older versions of the approval step filled in when a creator left a field
// blank. It was never written by the creator, so it is not shown on public profiles.
const FILLER = new Set(
  [
    "Featured Star Model",
    "Featured Star",
    "FSIA certified elite runway influencer.",
    "FSIA elite brand ambassador.",
    // The same filler after the API renamed FSIA
    "Influencer Awards certified elite runway influencer.",
    "Influencer Awards elite brand ambassador.",
    "Enthusiastic fashion icon looking to make an impact on the high-fashion runway.",
    "Elegance is standard."
  ].map((s) => s.toLowerCase())
);

export const clean = (value: unknown): string => {
  const text = typeof value === "string" ? value.trim() : "";
  return text && !FILLER.has(text.toLowerCase()) ? text : "";
};

export interface ProfileView {
  creator: Creator;
  slug: string;
  name: string;
  role: string;
  city: string;
  image: string;
  bio: string;
  quote: string;
  category: string;
  reach: string;
  engagement: string;
  reviewed: boolean;
  /** Extra facts the admin added (e.g. "Campaigns": "12 brands") */
  facts: { label: string; value: string }[];
  portfolio: string[];
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const factLabel = (key: string) =>
  key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const isImageUrl = (u: unknown): u is string => typeof u === "string" && /^(https?:\/\/|data:image\/|\/)/i.test(u.trim());

export function toProfile(creator: Creator, category = ""): ProfileView {
  const stats = (creator.stats || {}) as Creator["stats"];
  const facts = Object.entries(stats)
    .filter(([k, v]) => !["reach", "engagement", "verified"].includes(k) && clean(String(v ?? "")))
    .map(([k, v]) => ({ label: factLabel(k), value: String(v).trim() }));
  const image = isImageUrl(creator.image) ? creator.image.trim() : "";
  return {
    creator,
    slug: slugify(creator.name || ""),
    name: (creator.name || "").trim(),
    role: clean(creator.role),
    city: clean(creator.city),
    image,
    bio: clean(creator.bio),
    quote: clean(creator.quote),
    category: clean(category),
    reach: clean(String(stats.reach ?? "")),
    engagement: clean(String(stats.engagement ?? "")),
    reviewed: stats.verified !== false,
    facts,
    // The cover photo is shown separately, so it is not repeated in the gallery
    portfolio: Array.from(new Set((creator.portfolio || []).filter(isImageUrl).map((u) => u.trim()))).filter((u) => u !== image)
  };
}

/** Every published profile, once, with the gallery section it belongs to as its category. */
export function profilesFromSections(sections: { title?: string; creators?: Creator[] }[]): ProfileView[] {
  const seen = new Set<string>();
  const out: ProfileView[] = [];
  for (const section of sections || []) {
    for (const c of section.creators || []) {
      if (!c || !c.name) continue;
      const p = toProfile(c, section.title || "");
      if (!p.slug || seen.has(p.slug)) continue;
      seen.add(p.slug);
      out.push(p);
    }
  }
  return out;
}

export const initials = (name: string) =>
  name
    .replace(/^(Dr\.?|Mr\.?|Ms\.?|Mrs\.?)\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
