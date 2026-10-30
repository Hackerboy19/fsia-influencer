// Social media links on creator profiles. The admin or the creator can type a full link
// or just a handle (@name); either way the public profile only ever links to https pages
// on the platform's own site.

export const SOCIAL_PLATFORMS = [
  { id: "instagram", label: "Instagram", host: "instagram.com", base: "https://www.instagram.com/", placeholder: "@username or instagram.com/username" },
  { id: "youtube", label: "YouTube", host: "youtube.com", base: "https://www.youtube.com/@", placeholder: "@channel or youtube.com/@channel" },
  { id: "facebook", label: "Facebook", host: "facebook.com", base: "https://www.facebook.com/", placeholder: "facebook.com/page" },
  { id: "x", label: "X (Twitter)", host: "x.com", base: "https://x.com/", placeholder: "@username" },
  { id: "linkedin", label: "LinkedIn", host: "linkedin.com", base: "https://www.linkedin.com/in/", placeholder: "linkedin.com/in/name" },
  { id: "website", label: "Website", host: "", base: "", placeholder: "https://yoursite.com" }
] as const;

export type SocialId = (typeof SOCIAL_PLATFORMS)[number]["id"];
export type SocialLinks = Partial<Record<SocialId, string>>;

const HOSTS: Record<string, string[]> = {
  instagram: ["instagram.com", "instagr.am"],
  youtube: ["youtube.com", "youtu.be"],
  facebook: ["facebook.com", "fb.com", "fb.me"],
  x: ["x.com", "twitter.com"],
  linkedin: ["linkedin.com"]
};

const hostMatches = (host: string, allowed: string[]) =>
  allowed.some((h) => host === h || host.endsWith("." + h));

/** Keeps only known platforms with short text values (used before saving). */
export function cleanSocial(input: unknown): SocialLinks {
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const out: SocialLinks = {};
  for (const p of SOCIAL_PLATFORMS) {
    const v = typeof o[p.id] === "string" ? (o[p.id] as string).trim().slice(0, 200) : "";
    if (v) out[p.id] = v;
  }
  return out;
}

/** A safe https link for one platform, or "" when the value is not usable. */
export function socialUrl(id: SocialId, raw: string): string {
  let v = (raw || "").trim();
  if (!v || /\s/.test(v)) return "";
  const platform = SOCIAL_PLATFORMS.find((p) => p.id === id);
  if (!platform) return "";

  // A bare handle: @name or name
  const handle = v.replace(/^@/, "");
  if (id !== "website" && /^[A-Za-z0-9._-]{1,60}$/.test(handle) && !hostMatches(handle.toLowerCase().replace(/^www\./, ""), HOSTS[id])) {
    return platform.base + handle;
  }

  // A link, with or without https://
  if (!/^https?:\/\//i.test(v)) {
    if (!/^[\w-]+(\.[\w-]+)+(\/|$)/.test(v)) return "";
    v = "https://" + v;
  }
  try {
    const url = new URL(v);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    const host = url.hostname.toLowerCase();
    if (id !== "website" && !hostMatches(host, HOSTS[id])) return "";
    url.protocol = "https:";
    return url.toString();
  } catch {
    return "";
  }
}

/** Short text to show for a link: @handle for social sites, the domain for a website. */
export function socialText(id: SocialId, url: string): string {
  try {
    const u = new URL(url);
    if (id === "website") return u.hostname.replace(/^www\./, "") + (u.pathname.length > 1 ? u.pathname.replace(/\/$/, "") : "");
    const parts = u.pathname.split("/").filter(Boolean);
    const last = (id === "linkedin" && parts[0] === "in" ? parts[1] : parts[0]) || "";
    return last ? "@" + last.replace(/^@/, "") : u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** The profile's usable links, in a fixed order. */
export function socialList(links: unknown): { id: SocialId; label: string; url: string; text: string }[] {
  const clean = cleanSocial(links);
  return SOCIAL_PLATFORMS.flatMap((p) => {
    const url = clean[p.id] ? socialUrl(p.id, clean[p.id]!) : "";
    return url ? [{ id: p.id, label: p.label, url, text: socialText(p.id, url) }] : [];
  });
}
