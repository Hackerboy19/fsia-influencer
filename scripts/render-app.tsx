// Renders the real React app for one route to static HTML at build time, so the first
// response already holds the page's header, copy, forms and footer (not only a summary).
// Data from the API (profiles, campaigns, plans) loads in the browser, so those lists
// are prerendered in their loading state. The browser then renders the app over this
// markup with createRoot, so nothing here has to match it exactly.
import { renderToString } from "react-dom/server";
import { MotionConfig } from "motion/react";

// Imported before the fake `window` exists: react-hot-toast's styling library writes to
// `document` at import time when it sees a window
const { default: App } = await import("../src/App.tsx");

export function renderApp(pathname: string): string {
  const g = globalThis as any;
  const previous = g.window;
  // App reads the address (which page, filters, shared profile) while rendering
  g.window = {
    location: { pathname, search: "", hash: "" },
    history: { state: null },
    addEventListener() {},
    removeEventListener() {}
  };
  try {
    const html = renderToString(
      <MotionConfig reducedMotion="user">
        <App />
      </MotionConfig>
    );
    // Entrance animations start hidden; without JavaScript they would never run
    return html.replace(/ style="opacity:0;?(?:transform:[^";]*;?)?"/g, "");
  } finally {
    g.window = previous;
  }
}
