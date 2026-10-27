// Vercel preview deployments serve the pages only: the API (and its database) runs on the
// live host. Pages use this to explain missing live data calmly instead of showing an error.
export function isPreviewHost(): boolean {
  if (typeof window === "undefined") return false;
  return /\.vercel\.app$/i.test(window.location.hostname);
}
