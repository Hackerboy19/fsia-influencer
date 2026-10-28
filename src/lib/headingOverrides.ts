// Admin → Pages & SEO can replace the text of a page's first two H2 and first three H3
// headings. The page components keep their own text; this swaps it in the browser after
// each render and puts the original back when the admin clears a field.

const ORIGINAL_ATTR = "data-seo-original";
const originals = new WeakMap<Element, string[]>();

function textNodes(el: Element): Text[] {
  const out: Text[] = [];
  const walk = el.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) out.push(n as Text);
  return out;
}

/** The headings that count, in page order: inside the main content, not inside a pop-up. */
export function pageHeadings(root: ParentNode, tag: "h2" | "h3"): Element[] {
  return Array.from(root.querySelectorAll(tag)).filter((el) => !el.closest('[role="dialog"]'));
}

/** The page's own text for a heading (before any replacement). */
export const originalText = (el: Element) => (el.getAttribute(ORIGINAL_ATTR) ?? el.textContent ?? "").replace(/\s+/g, " ").trim();

function apply(root: ParentNode, tag: "h2" | "h3", wanted: string[]) {
  pageHeadings(root, tag).forEach((el, i) => {
    const want = (wanted[i] || "").trim();
    const nodes = textNodes(el);
    if (!nodes.length) return;
    if (want) {
      if (!originals.has(el)) {
        originals.set(el, nodes.map((n) => n.nodeValue || ""));
        el.setAttribute(ORIGINAL_ATTR, (el.textContent || "").replace(/\s+/g, " ").trim());
      }
      if ((el.textContent || "") !== want) {
        nodes[0].nodeValue = want;
        nodes.slice(1).forEach((n) => (n.nodeValue = ""));
      }
    } else if (originals.has(el)) {
      const saved = originals.get(el)!;
      nodes.forEach((n, j) => (n.nodeValue = saved[j] ?? ""));
      originals.delete(el);
      el.removeAttribute(ORIGINAL_ATTR);
    }
  });
}

/** Applies the replacements now and again whenever the page content changes. Returns a stop function. */
export function watchHeadingOverrides(getRoot: () => HTMLElement | null, h2: string[], h3: string[]): () => void {
  const run = () => {
    const root = getRoot();
    if (!root) return;
    apply(root, "h2", h2);
    apply(root, "h3", h3);
  };
  run();
  if (typeof MutationObserver === "undefined") return () => {};
  let frame = 0;
  const observer = new MutationObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(run);
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  return () => {
    observer.disconnect();
    cancelAnimationFrame(frame);
    // Leave the page's own text in place for the next page
    const root = getRoot();
    if (root) {
      apply(root, "h2", []);
      apply(root, "h3", []);
    }
  };
}
