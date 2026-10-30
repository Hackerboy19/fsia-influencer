// Admin → Page content: any text or image on the public pages can be replaced.
// Changes are stored per page path, plus "*" for things on every page (menu, footer).
// Each change is keyed by the page's own text (or image address), so the page code keeps
// its built-in content and the replacement is laid over it in the browser. The server
// also writes the replacements into the prerendered HTML for search engines.

export type ContentScope = { t?: Record<string, string>; i?: Record<string, string> };
export type ContentOverrides = Record<string, ContentScope>;

export const ALL_PAGES = "*";
const MAX_TEXT = 2000;
const MAX_ENTRIES = 400;

/** Spacing differences do not matter when matching text. */
export const normaliseText = (s: string) => s.replace(/\s+/g, " ").trim();

const okImage = (u: string) => /^(https?:\/\/|\/)/i.test(u) && !/\s/.test(u);

/** Keeps only valid scopes, texts and image addresses, within size limits. */
export function cleanContent(input: unknown): ContentOverrides {
  const out: ContentOverrides = {};
  if (!input || typeof input !== "object") return out;
  for (const [scope, raw] of Object.entries(input as Record<string, unknown>)) {
    if (scope !== ALL_PAGES && !/^\/[a-z0-9\-\/]*$/i.test(scope)) continue;
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const s: ContentScope = {};
    const t = r.t && typeof r.t === "object" ? Object.entries(r.t as Record<string, unknown>) : [];
    for (const [k, v] of t.slice(0, MAX_ENTRIES)) {
      const key = normaliseText(k).slice(0, MAX_TEXT);
      const val = typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT) : "";
      if (key && val && key !== val) (s.t ||= {})[key] = val;
    }
    const i = r.i && typeof r.i === "object" ? Object.entries(r.i as Record<string, unknown>) : [];
    for (const [k, v] of i.slice(0, MAX_ENTRIES)) {
      const val = typeof v === "string" ? v.trim().slice(0, 2000) : "";
      if (k && okImage(k) && val && okImage(val) && k !== val) (s.i ||= {})[k.slice(0, 2000)] = val;
    }
    if (s.t || s.i) out[scope] = s;
  }
  return out;
}

let content: ContentOverrides = {};
export function setContentOverrides(input: unknown) {
  content = cleanContent(input);
}
export const getContentOverrides = () => content;
export const hasContentOverrides = () => Object.keys(content).length > 0;

const lookupText = (path: string, original: string) => {
  const key = normaliseText(original);
  if (!key) return "";
  return content[path]?.t?.[key] || content[ALL_PAGES]?.t?.[key] || "";
};
const lookupImage = (path: string, src: string) => content[path]?.i?.[src] || content[ALL_PAGES]?.i?.[src] || "";

// What we changed, so a page redraw or a removed change can be handled
const textState = new WeakMap<Text, { original: string; applied: string }>();
const SKIP = "script,style,textarea,input,select,option,noscript,[data-no-content-edit]";

/** The page's own text for a text node, even if it was replaced. */
export function originalOf(node: Text): string {
  const info = textState.get(node);
  return info && node.nodeValue === info.applied ? info.original : node.nodeValue || "";
}

/** The page's own address for an image, even if it was replaced. */
export function originalSrcOf(img: HTMLImageElement): string {
  const applied = img.getAttribute("data-content-src");
  const own = img.getAttribute("data-original-src");
  return applied && own && img.getAttribute("src") === applied ? own : img.getAttribute("src") || "";
}

function applyText(node: Text, path: string) {
  const current = node.nodeValue || "";
  const info = textState.get(node);
  const original = info && current === info.applied ? info.original : current;
  const want = lookupText(path, original);
  if (want) {
    const lead = original.match(/^\s*/)?.[0] || "";
    const trail = original.match(/\s*$/)?.[0] || "";
    const applied = lead + want + trail;
    if (current !== applied) node.nodeValue = applied;
    textState.set(node, { original, applied });
  } else if (info) {
    if (current === info.applied) node.nodeValue = info.original;
    textState.delete(node);
  }
}

function applyImage(img: HTMLImageElement, path: string) {
  const original = originalSrcOf(img);
  if (!original) return;
  const want = lookupImage(path, original);
  if (want) {
    if (!img.hasAttribute("data-original-src") || img.getAttribute("data-original-src") !== original) {
      img.setAttribute("data-original-src", original);
      if (img.hasAttribute("srcset")) img.setAttribute("data-original-srcset", img.getAttribute("srcset") || "");
    }
    img.removeAttribute("srcset");
    if (img.getAttribute("src") !== want) img.setAttribute("src", want);
    img.setAttribute("data-content-src", want);
  } else if (img.hasAttribute("data-content-src")) {
    if (img.getAttribute("src") === img.getAttribute("data-content-src")) {
      img.setAttribute("src", original);
      const set = img.getAttribute("data-original-srcset");
      if (set) img.setAttribute("srcset", set);
    }
    img.removeAttribute("data-content-src");
    img.removeAttribute("data-original-src");
    img.removeAttribute("data-original-srcset");
  }
}

/** Replaces text and images under root now. */
export function applyContent(root: HTMLElement, path: string) {
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT)
  });
  for (let n = walk.nextNode(); n; n = walk.nextNode()) applyText(n as Text, path);
  root.querySelectorAll("img").forEach((img) => {
    if (!img.closest(SKIP)) applyImage(img, path);
  });
}

/** Keeps the replacements in place while the page redraws. Returns a stop function. */
export function watchContent(getRoot: () => HTMLElement | null, path: string): () => void {
  let running = false;
  const run = () => {
    const root = getRoot();
    if (!root || running) return;
    running = true;
    try {
      applyContent(root, path);
    } finally {
      running = false;
    }
  };
  run();
  let frame = 0;
  const observer = new MutationObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(run);
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["src"] });
  return () => {
    observer.disconnect();
    cancelAnimationFrame(frame);
  };
}
