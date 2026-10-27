# influencer.fsia.in — Final report (SEO, branding and technical optimisation)

**Date:** 19 October 2026 · **Branch:** `claude/friendly-cannon-cn11go` (commit `e155bd9` and later)
**Release bundle:** `release/fsia-influencer-live.zip` (built by `npm run package`)
**Detailed findings:** [`AUDIT-REPORT.md`](AUDIT-REPORT.md) covers branding, typography, navigation, forms and security.

Status words: **PASS** means verified with evidence; **FAIL** means checked and failing; **NOT VERIFIED** means it can't be checked from here yet (usually because the new build isn't uploaded); **BLOCKED** means it needs access or information I don't have.

---

## A. Audit findings

| Area | Finding on the live site (read-only checks, 19 Oct 2026) |
|---|---|
| Stack | React 19 / Vite 6 single-page app. A build step pre-renders a real HTML file per route. A PHP 8.3 API with a JSON-file store runs on Plesk (nginx → Apache). The live build comes from PR #1's lineage, and this branch builds on it. |
| Retired word | Not found in any page, metadata, JSON-LD, sitemap, robots.txt, bundle or API response. It is still shown on **www.fsia.in** (linked from the "FSIA Portal" button) and on the old copy at **fsia-influencer.vercel.app**. |
| Metadata | Unique title, description and canonical on all 6 indexable pages, present in the initial HTML; Open Graph and Twitter cards present; `/admin/` is `noindex`. |
| JSON-LD | Organization, WebSite, WebPage and FAQPage are present and valid. **No BreadcrumbList** on inner pages. |
| Sitemap | 6 canonical URLs, but every `<lastmod>` is the **build date**, not the date the content changed. |
| Redirects | `http://influencer.fsia.in/talent` takes **2 hops** (→ `https://…/talent` → `https://…/talent/`). |
| Images | **1 broken creator photo** (an Unsplash image was removed upstream); it shows as a broken image on 3 page/size combinations. |
| Contrast | The admin set the accent colour to `#2f2a23`. Used as text on the dark bars it reads at about 1.2:1, which gave **17 WCAG failures**. |
| Analytics | One GA4 tag (`G-H2EP91PV1E`), one `config`, no GTM. |
| Security headers | The HTML pages send no `X-Frame-Options` and no HSTS. These must be set in Plesk's nginx settings. |

Live audit of the **current (old) build** with `npm run audit -- https://influencer.fsia.in`: http, seo, analytics, branding, runtime and links pass. Three groups fail, all fixed on this branch: schema (5 BreadcrumbList checks), images (3) and a11y contrast (17).

## B. Implemented changes

This list covers this round. Earlier rounds are in `AUDIT-REPORT.md`: soft 404s, retired-word filter, WCAG fixes, forms, catwalk arrows, hidden admin button, creator categories with "Other", and security hardening.

1. **Structured data** (`src/seo.ts`): every inner page now has a `BreadcrumbList` (Home → page), and every WebPage has `inLanguage: en-IN` and an `ImageObject` `primaryImageOfPage` (the real 1200×630 OG image). ProfilePage/Person is **deliberately not used**: creator profiles are overlays, not their own URLs, so there is no page for that markup to describe. No ratings, reviews or events were invented.
2. **Sitemap** (`scripts/prerender-seo.ts`): `lastmod` removed, because a build date isn't a content date and Google ignores lastmod it can't trust. It lists only the 6 indexable canonical URLs; `/admin/` and the 404 page are excluded.
3. **Redirects** (`php-backend/.htaccess`): a folder URL without a trailing slash now goes straight to `https://…/folder/` in **one hop**, for http and https alike.
4. **Accent colour** (`src/lib/color.ts`): any accent the admin picks is lightened, keeping its hue, until it reaches 4.5:1 against the lightest dark surface (#333). The stored setting is **not changed**. The default `#E1C699` is unchanged.
5. **Broken image**: the dead creator photo was replaced, and any card image that fails to load falls back to the logo.
6. **Audit script** (`scripts/audit-site.mjs`): new checks for schema (one Organization/WebSite/WebPage; WebPage URL equals the canonical; breadcrumb ends at the page; FAQ count matches the visible questions; no rating/review/event claims), analytics (exactly one gtag.js and one config, no GTM) and broken images. Test runs block Google Analytics, so they no longer send fake visits to the real property.

## C. SEO infrastructure

| Item | State |
|---|---|
| `robots.txt` | `Allow: /`, `Disallow: /admin/`, sitemap line. CSS, JS, images and the API are not blocked, so Google can render the pages. |
| `sitemap.xml` | 6 URLs: `/`, `/talent/`, `/campaigns/`, `/join/`, `/membership/`, `/faq/`. All return 200, are self-canonical and indexable. |
| Canonicals | Absolute https URLs with a trailing slash; they match the sitemap and the WebPage `url`. |
| JSON-LD | Organization, WebSite, WebPage (+ ImageObject), BreadcrumbList on inner pages, FAQPage on `/faq/`. **validator.schema.org: 0 errors, 0 warnings on all 6 pages.** FAQ rich results should not be expected: Google limits them to government and health sites. |
| GA4 | `G-H2EP91PV1E` (already on the site, not invented). Verified in a browser by intercepting the collect requests: one `page_view` per page with the right title, no duplicates, including in-app navigation (GA4 enhanced measurement, browser-history events). |
| GTM | **Not installed**, on purpose. No container ID was supplied, and GA4 alone does the job; adding GTM as well would risk double counting. |
| Search Console | **BLOCKED.** No verification token or account access was supplied. The build accepts one through the `GSC_VERIFICATION` environment variable (see `DEPLOY.md`), or the domain can be verified by DNS. Nothing was submitted, and I make no claim about indexing. |

## D. Test results (local builds of the final code)

| Suite | Passed | Failed | Blocked / untested |
|---|---|---|---|
| `npm test` (type-check + unit: retired-word filter, phone/email, CSV safety, accent contrast, Node↔PHP parity) | all | 0 | — |
| `npm run audit` on PHP build | **338/338** | 0 | 1 warning: `/admin/` description is short (noindex page; intentional) |
| `npm run audit` on PHP build **with the live accent `#2f2a23` set** | **338/338** | 0 | — |
| `npm run test:journeys` on PHP build (fresh DB) | **151/151** | 0 | — |
| `npm run test:journeys` on Node build (fresh DB) | **151/151** | 0 | — |
| Schema validator (validator.schema.org) | 6/6 pages, 0 errors | 0 | — |
| Live audit of the **new** build (https://influencer.fsia.in) | **338/338** | 0 | 1 warning (`/admin/` description) |
| One-hop redirects (live) | https no-slash, http root | http + no-slash: 2 hops (Plesk nginx) | — |
| Real-device testing, Core Web Vitals field data (CrUX) | — | — | untested; needs real traffic |

The audit covers HTTP status codes, metadata, canonicals, the sitemap and robots.txt, 404s, schema, analytics, the retired word (HTML, bundles, API, rendered DOM), images, layout overflow at 375/768/1440 px, axe WCAG 2.2 AA on every page, dialog and the admin sign-in, JS errors and internal links. The journeys cover every navigation path and all 4 public forms (invalid input, server failure, double click, success, draft restore, stored data), the security limits, the catwalk arrows, and the categories with "Other".

## E. Deployment status

**Deployed by the owner and verified live on 19 Oct 2026.** `npm run audit -- https://influencer.fsia.in` gives **338/338 checks passed** (one warning: the short `/admin/` description, a noindex page). The live pages carry the BreadcrumbList; the sitemap has no `lastmod`; unknown URLs return 404; `/DEPLOY.md` returns 403; HSTS, X-Frame-Options, nosniff, Referrer-Policy and Permissions-Policy are now sent. The stored accent is still `#2f2a23`, and it now displays readably.

One item remains: `http://…/talent` (http **and** no trailing slash) still takes 2 hops, because Plesk's nginx makes the http→https redirect before Apache's `.htaccess` runs. `https://…/talent` and `http://…/` are a single hop. To make it one hop, turn off *Permanent SEO-safe 301 redirect from HTTP to HTTPS* in Plesk → Hosting settings; `.htaccess` then handles both. This is low priority: canonicals and the sitemap never use those URLs.

To deploy: back up, extract `fsia-influencer-live.zip` over the site root (data in `storage/` is kept), hard-refresh, then run `npm run audit -- https://influencer.fsia.in`. Every check should pass.

## F. Pending external actions (owner)

1. ~~Upload the new zip~~ (done and verified). Optional: switch off Plesk's HTTP→HTTPS redirect so `.htaccess` makes every redirect in one hop (see E).
2. **Delete `DEPLOY.md` on the server** (extracting a zip doesn't remove old files).
3. **Change the admin password** if it is still the default (the site refuses admin actions until you do).
4. ~~Security headers~~: now sent on live pages.
5. **Accent colour (optional):** the site now displays `#2f2a23` lightened to a readable grey. To get the gold look back, set it to `#E1C699` in Admin → Campaign Copy.
6. **Take down fsia-influencer.vercel.app** or redirect it here. It shows the retired branding and competes with this site in Google.
7. **Search Console:** verify the domain, submit `https://influencer.fsia.in/sitemap.xml`, request indexing for the main pages, and validate the old Soft 404 entries.
8. **Consent:** if visitors from the EU/UK matter, add a cookie-consent banner with Consent Mode for GA4. India's DPDP Act also calls for a privacy notice; there is none yet (see `AUDIT-REPORT.md` §11).
9. Check that the admin audit log records real visitor IPs.
10. Decide on the "FSIA Portal" link to www.fsia.in, which shows the retired branding.

## G. Final acceptance checklist

| # | Requirement | Status |
|---|---|---|
| 1 | Retired word absent from rendered pages, metadata, SEO files, bundles, API (local build) | **PASS** |
| 2 | Retired word absent on the live site | **PASS** (current build); fsia.in and the Vercel copy are outside this site: **FAIL**, owner action |
| 3 | WCAG 2.2 AA (axe) on all pages, dialogs and admin sign-in at 3 sizes, including with the live accent | **PASS** (local and live) |
| 4 | Navigation, catwalk arrows, admin button hidden | **PASS** (local) |
| 5 | All 4 public forms validate, submit once, persist, and survive failures | **PASS** (local, both backends) |
| 6 | Unique titles, descriptions, canonicals, OG/Twitter in the initial HTML | **PASS** (local and live) |
| 7 | JSON-LD valid, no invented data, BreadcrumbList + ImageObject | **PASS** (local and live) |
| 8 | sitemap.xml: eligible URLs only, no false lastmod | **PASS** (live) |
| 9 | robots.txt correct | **PASS** |
| 10 | Real 404s, no soft 404s | **PASS** (live) |
| 11 | Single-hop redirects | **FAIL** for http + no-slash only (Plesk setting, see E); others **PASS** |
| 12 | No broken images | **PASS** (live) |
| 13 | GA4 single tag, correct page_views, no duplicates | **PASS** |
| 14 | GTM | **NOT APPLICABLE**: no container supplied, not needed |
| 15 | Search Console verified, sitemap submitted, pages indexed | **BLOCKED** (no access or token) |
| 16 | Security fixes (default-password lock, limits, hidden versions, blocked files) | **PASS** (live: headers sent, `DEPLOY.md` 403). Still delete the leftover `DEPLOY.md` file |
| 17 | Automated tests pass | **PASS**: audit 338/338, journeys 151/151 on PHP and on Node, unit tests all pass |
| 18 | Deployed and verified live | **PASS**: 338/338 live audit, 19 Oct 2026 |
