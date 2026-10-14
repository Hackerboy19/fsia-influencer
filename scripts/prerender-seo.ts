// Post-build step: writes route-specific HTML (dist/<route>/index.html),
// robots.txt and sitemap.xml so every page is crawlable without JavaScript.
//   GSC_VERIFICATION=<token> npm run package   → also embeds the Search Console meta tag
import fs from "fs";
import path from "path";
import { ROUTES, SITE_URL, renderHead, renderBody } from "../src/seo";

const dist = path.join(process.cwd(), "dist");
const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");
if (!template.includes("<!--SEO-HEAD-->") || !template.includes("<!--SEO-BODY-->")) {
  throw new Error("dist/index.html is missing the SEO markers — run `vite build` first.");
}

const gsc = (process.env.GSC_VERIFICATION || "").trim();
const gscTag = gsc ? `<meta name="google-site-verification" content="${gsc.replace(/"/g, "")}" />` : "<!--GSC-VERIFICATION-->";

for (const route of ROUTES) {
  const html = template
    .replace(/<!--SEO-HEAD-->[\s\S]*?<!--\/SEO-HEAD-->/, renderHead(route))
    .replace("<!--SEO-BODY-->", renderBody(route))
    .replace("<!--GSC-VERIFICATION-->", gscTag);
  const dir = path.join(dist, route.path);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

const today = new Date().toISOString().slice(0, 10);
const urls = ROUTES.filter((r) => r.indexable)
  .map(
    (r) =>
      `  <url>\n    <loc>${SITE_URL}${r.path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`
  )
  .join("\n");
fs.writeFileSync(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
);

fs.writeFileSync(
  path.join(dist, "robots.txt"),
  `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
);

console.log(`SEO: ${ROUTES.length} route pages, sitemap.xml (${ROUTES.filter((r) => r.indexable).length} URLs), robots.txt${gsc ? ", Search Console tag" : ""}`);
