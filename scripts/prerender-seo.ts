// Post-build step.
//  1. Saves the untouched page template as dist/seo-template.html. The PHP and
//     Node servers fill it in on every request with the SEO settings from the
//     admin panel, so changes there reach search engines immediately.
//  2. Writes static fallbacks (dist/<route>/index.html, profile pages for the
//     starter roster, robots.txt, sitemap.xml) for static-only hosting.
//   GSC_VERIFICATION=<token> npm run package   → also embeds a Search Console tag in the fallbacks
import fs from "fs";
import path from "path";
import { createDefaultDb } from "../server/db";
import {
  ROUTES,
  EMPTY_SEO,
  SeoConfig,
  assignProfileSlugs,
  resolvePageMeta,
  resolveProfileMeta,
  renderHead,
  renderSitemap,
  renderRobots
} from "../src/seo";

const dist = path.join(process.cwd(), "dist");
const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");
if (!template.includes("<!--SEO-HEAD-->") || !template.includes("<!--SEO-BODY-->")) {
  throw new Error("dist/index.html is missing the SEO markers — run `vite build` first.");
}
fs.writeFileSync(path.join(dist, "seo-template.html"), template);

const seo: SeoConfig = {
  ...EMPTY_SEO,
  site: { googleVerification: (process.env.GSC_VERIFICATION || "").trim() }
};
const profiles = assignProfileSlugs(createDefaultDb().creators);

const fill = (head: string, body: string) =>
  template.replace(/<!--SEO-HEAD-->[\s\S]*?<!--\/SEO-HEAD-->/, head).replace("<!--SEO-BODY-->", body);

const write = (urlPath: string, html: string) => {
  const dir = path.join(dist, urlPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
};

for (const route of ROUTES) {
  const meta = resolvePageMeta(route, seo, profiles);
  write(route.path, fill(renderHead(meta, seo), meta.bodyHtml));
}
for (const entry of profiles) {
  const meta = resolveProfileMeta(entry, seo);
  write(entry.path, fill(renderHead(meta, seo), meta.bodyHtml));
}

fs.writeFileSync(path.join(dist, "sitemap.xml"), renderSitemap(seo, profiles, new Date().toISOString().slice(0, 10)));
fs.writeFileSync(path.join(dist, "robots.txt"), renderRobots(seo));

console.log(`SEO: template + ${ROUTES.length} page and ${profiles.length} profile fallbacks, sitemap.xml, robots.txt`);
