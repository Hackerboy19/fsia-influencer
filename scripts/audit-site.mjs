// Automated site audit: SEO, status codes, retired branding, links and WCAG 2.2 AA.
//
//   node scripts/audit-site.mjs [baseUrl] [--report=path.json] [--no-browser]
//
// Defaults to http://127.0.0.1:8080 (the packaged PHP build, see README). Pass
// https://influencer.fsia.in to audit the live site. Exits 1 when any check fails.
import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const BASE = (args.find((a) => !a.startsWith("--")) || "http://127.0.0.1:8080").replace(/\/+$/, "");
const REPORT = args.find((a) => a.startsWith("--report="))?.slice(9);
const BROWSER = !args.includes("--no-browser");

// The retired brand word. Searched case-insensitively, including HTML-entity,
// percent-encoded and JSON-escaped spellings.
const PROHIBITED = "forever";
const prohibitedPattern = new RegExp(
  PROHIBITED.split("")
    .map((ch) => {
      const code = ch.charCodeAt(0);
      const upper = ch.toUpperCase().charCodeAt(0);
      const hex = (n) => n.toString(16);
      return `(?:${ch}|&#0*(?:${code}|${upper});|&#x0*(?:${hex(code)}|${hex(upper)});|%(?:${hex(code)}|${hex(upper)})|\\\\u00(?:${hex(code)}|${hex(upper)}))`;
    })
    .join(""),
  "i"
);

const PUBLIC_ROUTES = ["/", "/talent/", "/campaigns/", "/join/", "/membership/", "/faq/"];
const PRIVATE_ROUTES = ["/admin/"];
const PUBLIC_APIS = ["/api/creators", "/api/campaigns", "/api/membership-plans", "/api/settings"];
const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 }
];

const results = [];
const record = (area, check, ok, detail = "", severity = ok ? "pass" : "fail") =>
  results.push({ area, check, ok, severity, detail });
const warn = (area, check, detail) => results.push({ area, check, ok: true, severity: "warn", detail });

async function get(path, init = {}) {
  const url = path.startsWith("http") ? path : BASE + path;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { redirect: "manual", ...init });
      const body = await res.text();
      return { status: res.status, headers: res.headers, body, url };
    } catch (error) {
      if (attempt >= 4) throw error;
      await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
    }
  }
}

const tag = (html, re) => html.match(re)?.[1]?.trim();
const decode = (s = "") =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const findProhibited = (text) => {
  const m = text.match(prohibitedPattern);
  if (!m) return "";
  const i = m.index ?? 0;
  return text.slice(Math.max(0, i - 60), i + m[0].length + 60).replace(/\s+/g, " ");
};

async function auditHttp() {
  const titles = new Map();
  const descriptions = new Map();
  const assets = new Set();

  for (const path of [...PUBLIC_ROUTES, ...PRIVATE_ROUTES]) {
    const indexable = PUBLIC_ROUTES.includes(path);
    const res = await get(path);
    const html = res.body;
    record("http", `${path} returns 200`, res.status === 200, `status ${res.status}`);
    const title = decode(tag(html, /<title>([^<]*)<\/title>/i));
    const description = decode(tag(html, /<meta name="description" content="([^"]*)"/i));
    const canonical = tag(html, /<link rel="canonical" href="([^"]*)"/i);
    const robots = tag(html, /<meta name="robots" content="([^"]*)"/i) || "";
    const ogUrl = tag(html, /<meta property="og:url" content="([^"]*)"/i);
    const h1s = (html.match(/<h1[\s>]/gi) || []).length;

    record("seo", `${path} has a <title>`, !!title, title);
    record("seo", `${path} has a meta description`, !!description, description);
    if (title && title.length > 65) warn("seo", `${path} title length`, `${title.length} characters (may be truncated in results)`);
    if (description && (description.length < 70 || description.length > 160))
      warn("seo", `${path} description length`, `${description.length} characters`);
    record("seo", `${path} has a canonical URL ending in its own path`, !!canonical && canonical.endsWith(path), canonical);
    record("seo", `${path} og:url matches canonical`, ogUrl === canonical, `${ogUrl}`);
    record(
      "seo",
      `${path} robots meta is ${indexable ? "indexable" : "noindex"}`,
      indexable ? /index/.test(robots) && !/noindex/.test(robots) : /noindex/.test(robots),
      robots
    );
    record("seo", `${path} server HTML has exactly one <h1>`, h1s === 1, `${h1s} found`);
    const xRobots = res.headers.get("x-robots-tag") || "";
    if (indexable) record("seo", `${path} has no X-Robots-Tag noindex`, !/noindex/i.test(xRobots), xRobots || "none");

    const nodes = [];
    for (const block of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      let ok = true;
      try {
        const data = JSON.parse(block[1]);
        nodes.push(...(data["@graph"] || [data]));
        ok = (data["@context"] || "") === "https://schema.org";
      } catch {
        ok = false;
      }
      record("schema", `${path} JSON-LD parses with the schema.org context`, ok);
    }
    if (indexable) {
      const ofType = (t) => nodes.filter((n) => n["@type"] === t);
      record("schema", `${path} has one Organization, WebSite and WebPage`,
        ofType("Organization").length === 1 && ofType("WebSite").length === 1 && ofType("WebPage").length === 1);
      record("schema", `${path} WebPage url matches the canonical`, ofType("WebPage")[0]?.url === canonical, ofType("WebPage")[0]?.url);
      const crumbs = ofType("BreadcrumbList")[0]?.itemListElement || [];
      if (path === "/") record("schema", "/ has no breadcrumb", !crumbs.length);
      else
        record("schema", `${path} BreadcrumbList ends at this page`,
          crumbs.length === 2 && crumbs[0].item === `${new URL(canonical).origin}/` && crumbs[1].item === canonical && crumbs.every((c, i) => c.position === i + 1));
      if (path === "/faq/") {
        const faq = ofType("FAQPage")[0];
        const visible = (html.match(/<h2>/g) || []).length;
        record("schema", "/faq/ FAQPage lists the questions shown on the page", !!faq && faq.mainEntity.length === visible && visible > 0,
          `${faq?.mainEntity?.length} in schema, ${visible} on the page`);
      }
      const fakeClaims = nodes.some((n) => ["AggregateRating", "Review", "Event"].includes(n["@type"]) || n.aggregateRating || n.review);
      record("schema", `${path} makes no rating, review or event claims`, !fakeClaims);
    }

    // Google tag: exactly one gtag.js and one config call (no duplicate page views); no GTM container
    const gtagScripts = (html.match(/googletagmanager\.com\/gtag\/js\?id=G-[A-Z0-9]+/g) || []).length;
    const configs = (html.match(/gtag\(\s*['"]config['"]/g) || []).length;
    const gtm = /googletagmanager\.com\/gtm\.js/.test(html);
    record("analytics", `${path} loads the Google tag once with one config`, gtagScripts === 1 && configs === 1 && !gtm,
      `${gtagScripts} gtag.js, ${configs} config, GTM ${gtm ? "present" : "absent"}`);

    if (indexable) {
      if (title) titles.set(title, [...(titles.get(title) || []), path]);
      if (description) descriptions.set(description, [...(descriptions.get(description) || []), path]);
    }
    const hit = findProhibited(html);
    record("branding", `${path} HTML is free of the retired brand word`, !hit, hit);
    for (const m of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)) assets.add(m[1]);
  }

  for (const [title, paths] of titles) record("seo", `Title is unique: "${title}"`, paths.length === 1, paths.join(", "));
  for (const [desc, paths] of descriptions)
    record("seo", `Description is unique (${paths[0]})`, paths.length === 1, paths.join(", "));

  for (const asset of assets) {
    const res = await get(asset);
    record("http", `${asset} returns 200`, res.status === 200, `status ${res.status}`);
    const hit = findProhibited(res.body);
    record("branding", `${asset} is free of the retired brand word`, !hit, hit);
  }

  for (const api of PUBLIC_APIS) {
    const res = await get(api);
    record("http", `${api} returns 200 JSON`, res.status === 200 && /json/.test(res.headers.get("content-type") || ""), `status ${res.status}`);
    const hit = findProhibited(res.body);
    record("branding", `${api} data is free of the retired brand word`, !hit, hit);
  }

  // Soft-404 protection: unknown URLs must say 404, not serve the home page
  for (const path of ["/this-page-does-not-exist/", "/talent/unknown-profile", "/favicon-missing.png"]) {
    const res = await get(path);
    record("http", `${path} returns 404`, res.status === 404, `status ${res.status}`);
    if (res.status === 404 && /text\/html/.test(res.headers.get("content-type") || "")) {
      record("seo", `${path} 404 page is noindex`, /<meta name="robots" content="noindex/i.test(res.body));
    }
  }
  const apiMissing = await get("/api/does-not-exist");
  record("http", "/api/does-not-exist returns 404", apiMissing.status === 404, `status ${apiMissing.status}`);
  const apiHealth = await get("/api/health");
  record("seo", "API responses carry X-Robots-Tag noindex", /noindex/i.test(apiHealth.headers.get("x-robots-tag") || ""),
    apiHealth.headers.get("x-robots-tag") || "missing");

  // Trailing-slash variants should redirect to the canonical URL, not duplicate it
  const noSlash = await get("/talent");
  record("http", "/talent redirects to /talent/", [301, 308].includes(noSlash.status) && /\/talent\/$/.test(noSlash.headers.get("location") || ""),
    `status ${noSlash.status} → ${noSlash.headers.get("location") || "-"}`);

  const robots = await get("/robots.txt");
  record("seo", "robots.txt returns 200 text", robots.status === 200 && /text\/plain/.test(robots.headers.get("content-type") || ""));
  record("seo", "robots.txt lists the sitemap", /^Sitemap:\s*https:\/\/\S+\/sitemap\.xml/im.test(robots.body));
  record("seo", "robots.txt does not block public pages", !/^Disallow:\s*\/\s*$/im.test(robots.body));

  const sitemap = await get("/sitemap.xml");
  record("seo", "sitemap.xml returns 200 XML", sitemap.status === 200 && /xml/.test(sitemap.headers.get("content-type") || ""));
  const locs = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  record("seo", "sitemap.xml is a urlset with entries", /<urlset[^>]+sitemaps\.org/.test(sitemap.body) && locs.length > 0, `${locs.length} URLs`);
  for (const loc of locs) {
    const path = new URL(loc).pathname;
    record("seo", `sitemap URL ${path} is a public, indexable route`, PUBLIC_ROUTES.includes(path));
    const res = await get(path);
    record("seo", `sitemap URL ${path} returns 200`, res.status === 200, `status ${res.status}`);
    const canonical = tag(res.body, /<link rel="canonical" href="([^"]*)"/i);
    record("seo", `sitemap URL ${path} is self-canonical`, canonical === loc, canonical);
  }
  for (const path of PUBLIC_ROUTES)
    record("seo", `${path} is listed in sitemap.xml`, locs.some((l) => new URL(l).pathname === path));
}

async function auditBrowser() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    warn("browser", "Playwright available", "playwright is not installed — browser checks skipped");
    return;
  }
  const axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
  const browser = await chromium.launch(
    fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {}
  );
  const internalLinks = new Set();

  const runAxe = async (page, label) => {
    await page.addScriptTag({ content: axeSource });
    const out = await page.evaluate(async () => {
      // @ts-ignore
      const r = await window.axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
        resultTypes: ["violations"]
      });
      return r.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.slice(0, 6).map((n) => `${n.target.join(" ")} — ${n.failureSummary?.split("\n").slice(1, 2).join(" ").trim()}`),
        count: v.nodes.length
      }));
    });
    record("a11y", `${label}: no WCAG 2.2 AA violations`, out.length === 0,
      out.map((v) => `[${v.impact}] ${v.id} ×${v.count}: ${v.help}\n      ${v.nodes.join("\n      ")}`).join("\n    "));
  };

  const scanRendered = async (page, label) => {
    const text = await page.evaluate(() => {
      const parts = [document.title, document.body.innerText];
      document.querySelectorAll("[alt],[title],[aria-label],[placeholder],meta[content]").forEach((el) => {
        for (const a of ["alt", "title", "aria-label", "placeholder", "content"]) {
          const v = el.getAttribute(a);
          if (v) parts.push(v);
        }
      });
      return parts.join("\n");
    });
    const hit = findProhibited(text);
    record("branding", `${label}: rendered page is free of the retired brand word`, !hit, hit);
  };

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, reducedMotion: "reduce" });
    // Audit traffic must never reach the site's real Google Analytics property
    await context.route(/google-analytics\.com|googletagmanager\.com/, (route) => route.abort());
    for (const path of [...PUBLIC_ROUTES, "/__entered__/"]) {
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => m.type() === "error" && !/WebGL|GPU|favicon/i.test(m.text()) &&
        !/google-analytics\.com|googletagmanager\.com/.test(m.location()?.url || "") && errors.push(m.text()));
      const target = path === "/__entered__/" ? "/" : path;
      const label = `${vp.name} ${path === "/__entered__/" ? "/ (explore view)" : path}`;
      await page.goto(BASE + target, { waitUntil: "networkidle" });
      if (path === "/__entered__/") {
        await page.click("#enter-exposition-btn");
        await page.waitForTimeout(1800);
      } else {
        await page.waitForTimeout(900);
      }
      const broken = await page.evaluate(() =>
        Array.from(document.images).filter((img) => img.complete && img.naturalWidth === 0 && img.getAttribute("src")).map((img) => img.getAttribute("src").slice(0, 80))
      );
      record("images", `${label}: no broken images`, broken.length === 0, broken.join(", "));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      record("layout", `${label}: no horizontal page scroll`, overflow <= 1, `${overflow}px wider than viewport`);
      await scanRendered(page, label);
      await runAxe(page, label);
      const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
      hrefs.filter((h) => h && h.startsWith("/") && !h.startsWith("//")).forEach((h) => internalLinks.add(h.split("#")[0]));
      record("runtime", `${label}: no JavaScript errors`, errors.length === 0, errors.slice(0, 5).join(" | "));
      await page.close();
    }

    // Every overlay: accessible, free of the retired word, closes on Escape and returns focus
    const dialogs = [
      { name: "brand enquiry", path: "/talent/", open: "#open-collaboration-form-btn, #open-collaboration-form-btn-mobile" },
      { name: "creator profile", path: "/talent/", open: 'button[aria-label^="View "]' },
      { name: "campaign application", path: "/campaigns/", open: 'button[aria-label^="Apply now for"]' },
      { name: "membership request", path: "/membership/", open: 'button:has-text("Enroll in")' }
    ];
    for (const d of dialogs) {
      const page = await context.newPage();
      const label = `${vp.name} ${d.name} dialog`;
      await page.goto(BASE + d.path, { waitUntil: "networkidle" });
      await page.waitForTimeout(600);
      const trigger = page.locator(d.open).filter({ visible: true }).first();
      if (!(await trigger.count())) {
        record("a11y", `${label}: trigger is visible`, false);
        await page.close();
        continue;
      }
      await trigger.focus();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(900);
      const dialog = page.locator('[role="dialog"]').last();
      record("a11y", `${label}: opens as role="dialog" with a name`, (await dialog.count()) > 0 &&
        !!((await dialog.getAttribute("aria-labelledby")) || (await dialog.getAttribute("aria-label"))));
      record("a11y", `${label}: focus moves into the dialog`, await page.evaluate(() =>
        !!document.activeElement?.closest('[role="dialog"]')));
      await runAxe(page, label);
      await scanRendered(page, label);
      await page.keyboard.press("Escape");
      const closed = await page
        .waitForFunction(() => !document.querySelector('[role="dialog"]'), null, { timeout: 4000 })
        .then(() => true, () => false);
      record("a11y", `${label}: Escape closes it and focus returns`, closed &&
        (await page.evaluate(() => document.activeElement !== document.body && !!document.activeElement)));
      await page.close();
    }

    // Admin sign-in (private, but still part of the site)
    if (vp.name === "desktop") {
      const page = await context.newPage();
      await page.goto(BASE + "/admin/", { waitUntil: "networkidle" });
      await page.waitForTimeout(1200);
      await runAxe(page, "desktop /admin/ sign-in");
      await scanRendered(page, "desktop /admin/ sign-in");
      await page.close();
    }
    await context.close();
  }

  for (const href of internalLinks) {
    const res = await get(href);
    record("links", `Internal link ${href} resolves`, res.status === 200, `status ${res.status}`);
  }
  await browser.close();
}

const started = Date.now();
await auditHttp();
if (BROWSER) await auditBrowser();

const failed = results.filter((r) => !r.ok);
const warnings = results.filter((r) => r.severity === "warn");
const byArea = {};
for (const r of results) {
  byArea[r.area] ??= { pass: 0, fail: 0, warn: 0 };
  byArea[r.area][r.severity]++;
}
console.log(`\nAudit of ${BASE} — ${results.length} checks in ${((Date.now() - started) / 1000).toFixed(1)}s\n`);
for (const [area, c] of Object.entries(byArea)) console.log(`  ${area.padEnd(9)} ${c.pass} pass  ${c.fail} fail  ${c.warn} warn`);
for (const w of warnings) console.log(`\n  WARN  [${w.area}] ${w.check}: ${w.detail}`);
for (const f of failed) console.log(`\n  FAIL  [${f.area}] ${f.check}${f.detail ? `\n    ${f.detail}` : ""}`);
console.log(failed.length ? `\n${failed.length} check(s) failed.` : "\nAll checks passed.");
if (REPORT) fs.writeFileSync(REPORT, JSON.stringify({ base: BASE, date: new Date().toISOString(), results }, null, 2));
process.exit(failed.length ? 1 : 0);
