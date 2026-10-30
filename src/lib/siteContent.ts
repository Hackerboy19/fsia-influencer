// Home page text the admin can change (Admin → Pages & SEO). Empty fields keep the built-in text.
export interface HomeHero {
  kicker?: string;
  headline?: string;
  accent?: string;
  intro?: string;
}

let homeHero: HomeHero = {};

const clip = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);

export function setHomeHero(input: unknown) {
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  homeHero = {
    kicker: clip(o.kicker, 80),
    headline: clip(o.headline, 90),
    accent: clip(o.accent, 90),
    intro: clip(o.intro, 400)
  };
}

export const getHomeHero = (): HomeHero => homeHero;

// Main menu names the admin can change (Admin → Pages & SEO → Menu names).
// The page addresses stay fixed so links and Google results keep working.
export const NAV_ITEMS = [
  { id: "home", label: "Home" },
  { id: "directory", label: "Discover Creators" },
  { id: "categories", label: "Categories" },
  { id: "catwalk", label: "3D Gallery" },
  { id: "greenlight", label: "Magazine" },
  { id: "awards", label: "Awards" },
  { id: "campaigns", label: "Campaigns" },
  { id: "forbrands", label: "For Brands" },
  { id: "forcreators", label: "For Creators" },
  { id: "resources", label: "Resources" }
] as const;
export type NavId = (typeof NAV_ITEMS)[number]["id"];

let navLabels: Partial<Record<NavId, string>> = {};

export function setNavLabels(input: unknown) {
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  navLabels = {};
  for (const item of NAV_ITEMS) {
    const v = clip(o[item.id], 30);
    if (v) navLabels[item.id] = v;
  }
}

export const getNavLabels = () => navLabels;
export const navLabel = (id: NavId) => navLabels[id] || NAV_ITEMS.find((i) => i.id === id)!.label;

// Logo uploaded in Admin → Site settings ("" keeps the built-in mark)
let brandLogo = { url: "", hidesName: false };
export function setBrandLogo(url: unknown, hidesName: unknown) {
  const u = typeof url === "string" && /^(https?:\/\/|\/)\S+$/i.test(url.trim()) ? url.trim() : "";
  brandLogo = { url: u, hidesName: !!u && hidesName === true };
}
export const getBrandLogo = () => brandLogo;
