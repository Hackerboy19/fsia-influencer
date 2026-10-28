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
