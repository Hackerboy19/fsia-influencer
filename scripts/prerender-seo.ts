// Post-build step: writes route-specific HTML (dist/<route>/index.html),
// robots.txt and sitemap.xml so every page is crawlable without JavaScript.
//   GSC_VERIFICATION=<token> npm run package   → also embeds the Search Console meta tag
import fs from "fs";
import path from "path";
import { ROUTES, SITE_URL, SITE_NAME, renderHead, renderBody, escapeHtml } from "../src/seo";
import { renderApp } from "./render-app";

const dist = path.join(process.cwd(), "dist");
const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");
if (!template.includes("<!--SEO-HEAD-->") || !template.includes("<!--SEO-BODY-->")) {
  throw new Error("dist/index.html is missing the SEO markers — run `vite build` first.");
}

const gsc = (process.env.GSC_VERIFICATION || "").trim();
const gscTag = gsc ? `<meta name="google-site-verification" content="${gsc.replace(/"/g, "")}" />` : "<!--GSC-VERIFICATION-->";

// Pages rendered from the app itself. The 3D gallery is a canvas and the admin area is
// private, so those two keep the short text summary instead.
const APP_RENDERED = new Set(["home", "directory", "campaigns", "apply", "membership", "starindia", "greenlight", "faq", "contact", "privacy"]);

for (const route of ROUTES) {
  let body = renderBody(route);
  if (APP_RENDERED.has(route.tab)) {
    try {
      body = renderApp(route.path);
    } catch (error) {
      // Never fail the release over this: the summary is still crawlable
      console.warn(`Prerender of ${route.path} failed, using the summary instead:`, error);
    }
  }
  const html = template
    .replace(/<!--SEO-HEAD-->[\s\S]*?<!--\/SEO-HEAD-->/, renderHead(route))
    .replace("<!--SEO-BODY-->", () => body)
    .replace("<!--GSC-VERIFICATION-->", gscTag);
  const dir = path.join(dist, route.path);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

const urls = ROUTES.filter((r) => r.indexable)
  .map(
    (r) =>
      // No <lastmod>: the build date is not when the page content changed, and Google
      // ignores lastmod values it cannot trust
      `  <url>\n    <loc>${SITE_URL}${r.path}</loc>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`
  )
  .join("\n");
fs.writeFileSync(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
);

// Standalone 404 page (served by ErrorDocument / the Node fallback with a real 404 status)
const links = ROUTES.filter((r) => r.indexable)
  .map((r) => `<li><a href="${r.path}">${escapeHtml(r.heading)}</a></li>`)
  .join("");
fs.writeFileSync(
  path.join(dist, "404.html"),
  `<!doctype html>
<html lang="en-IN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <title>Page not found | ${SITE_NAME}</title>
    <link rel="icon" href="/favicon.ico" sizes="48x48" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <style>
      body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #FAF9F6; color: #111; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; line-height: 1.6; }
      main { max-width: 560px; padding: 48px 24px; text-align: center; }
      .eyebrow { margin: 0; font-size: 13px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: #5c4415; }
      h1 { margin: 12px 0; font-family: Georgia, "Times New Roman", serif; font-size: clamp(2rem, 6vw, 3rem); line-height: 1.1; }
      p { color: #2e2c29; font-size: 17px; }
      .home { display: inline-block; margin: 16px 0 32px; padding: 14px 28px; border-radius: 12px; background: #111; color: #FAF9F6; font-weight: 600; text-decoration: none; }
      .home:hover { background: #2e2c29; }
      ul { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 20px; }
      ul a { color: #111; font-weight: 600; text-underline-offset: 4px; }
      a:focus-visible { outline: 2px solid #5c4415; outline-offset: 3px; }
    </style>
  </head>
  <body>
    <main>
      <p class="eyebrow">Error 404</p>
      <h1>We couldn't find that page</h1>
      <p>The link may be out of date, or the address may have a typo. These sections are available:</p>
      <a class="home" href="/">Go to the home page</a>
      <nav aria-label="Site sections"><ul>${links}</ul></nav>
    </main>
  </body>
</html>
`
);

fs.writeFileSync(
  path.join(dist, "robots.txt"),
  `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
);

console.log(`SEO: ${ROUTES.length} route pages, 404.html, sitemap.xml (${ROUTES.filter((r) => r.indexable).length} URLs), robots.txt${gsc ? ", Search Console tag" : ""}`);
