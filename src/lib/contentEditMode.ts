// The page inside Admin → Page content. Clicking a text or an image tells the admin panel
// what was picked; links and buttons do nothing while editing.
import { ALL_PAGES, normaliseText, originalOf, originalSrcOf } from "./contentOverrides";

export interface ContentPick {
  type: "fsia-edit-pick";
  kind: "text" | "image";
  /** The page's own text or image address (the key the change is saved under) */
  original: string;
  /** What is shown now (may already be replaced) */
  current: string;
  /** The page path, or "*" when the item sits in the menu or footer shown on every page */
  scope: string;
}

const STYLE = `
body[data-content-editing] :is(h1,h2,h3,h4,h5,h6,p,a,button,li,span,label,dt,dd,blockquote,figcaption,small,strong,em,td,th):hover{outline:2px dashed #a8742e;outline-offset:2px;cursor:text}
body[data-content-editing] img:hover{outline:3px dashed #a8742e;outline-offset:-3px;cursor:pointer}
body[data-content-editing] [data-content-picked]{outline:3px solid #a8742e !important;outline-offset:2px}
`;

function textNodeAt(x: number, y: number, target: Element): Text | null {
  const doc = document as any;
  let node: Node | null = null;
  if (doc.caretPositionFromPoint) node = doc.caretPositionFromPoint(x, y)?.offsetNode ?? null;
  else if (doc.caretRangeFromPoint) node = doc.caretRangeFromPoint(x, y)?.startContainer ?? null;
  if (node && node.nodeType === Node.TEXT_NODE && normaliseText(node.nodeValue || "") && target.contains(node)) return node as Text;
  const walk = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) if (normaliseText(n.nodeValue || "")) return n as Text;
  return null;
}

export function startContentEditing(pagePath: () => string): () => void {
  const style = document.createElement("style");
  style.textContent = STYLE;
  document.head.appendChild(style);
  document.body.setAttribute("data-content-editing", "");
  let picked: Element | null = null;

  const mark = (el: Element | null) => {
    picked?.removeAttribute("data-content-picked");
    picked = el;
    picked?.setAttribute("data-content-picked", "");
  };

  const send = (msg: ContentPick) => window.parent.postMessage(msg, window.location.origin);

  const onClick = (e: MouseEvent) => {
    const target = e.target as Element | null;
    if (!target || target.closest("[data-no-content-edit]")) return;
    e.preventDefault();
    e.stopPropagation();
    // The menu and footer repeat on every page; everything else belongs to this page
    const scopeFor = (el: Element) => (el.closest("[data-site-chrome]") ? ALL_PAGES : pagePath());

    const img =
      (target.closest("img") as HTMLImageElement | null) ||
      (document.elementsFromPoint(e.clientX, e.clientY).find((el) => el.tagName === "IMG") as HTMLImageElement | undefined) ||
      null;
    const text = target.tagName === "IMG" ? null : textNodeAt(e.clientX, e.clientY, target);

    if (text && text.parentElement) {
      mark(text.parentElement);
      send({ type: "fsia-edit-pick", kind: "text", original: normaliseText(originalOf(text)), current: normaliseText(text.nodeValue || ""), scope: scopeFor(text.parentElement) });
    } else if (img) {
      mark(img);
      send({ type: "fsia-edit-pick", kind: "image", original: originalSrcOf(img), current: img.getAttribute("src") || "", scope: scopeFor(img) });
    }
  };
  // Forms and links must not submit or navigate while editing
  const block = (e: Event) => {
    if (!(e.target as Element | null)?.closest?.("[data-no-content-edit]")) e.preventDefault();
  };

  document.addEventListener("click", onClick, true);
  document.addEventListener("submit", block, true);
  document.addEventListener("auxclick", block, true);
  return () => {
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("submit", block, true);
    document.removeEventListener("auxclick", block, true);
    mark(null);
    style.remove();
    document.body.removeAttribute("data-content-editing");
  };
}
