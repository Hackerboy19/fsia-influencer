// Profiles open on the directory page with ?profile=<slug>, so every profile has a link
// that can be shared and bookmarked without needing a separate server route.
export const PROFILE_PARAM = "profile";

export const profileHref = (slug: string) => `/creators/?${PROFILE_PARAM}=${encodeURIComponent(slug)}`;

export function profileSlugFromLocation(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(PROFILE_PARAM) || "";
}
