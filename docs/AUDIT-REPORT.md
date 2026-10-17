# influencer.fsia.in — Audit, fixes and verification

**Date:** 17 October 2026 · **Branch:** `claude/friendly-cannon-cn11go`
**Live site audited:** https://influencer.fsia.in (read-only; nothing was changed on the server)

This report names the retired brand word ("Forever") only where a technical finding has to identify it.

---

## 1. What the site actually is

| | Finding | Evidence |
|---|---|---|
| Framework | React 19 single-page app built with Vite 6 and Tailwind CSS 4, with a Three.js 3D "Explore" scene. Not Next.js and not server-rendered. | `package.json`, `src/` |
| SEO pages | A build step (`scripts/prerender-seo.ts`) writes a real HTML file per section (`/talent/`, `/campaigns/`, `/join/`, `/membership/`, `/faq/`) with its own title, description, canonical, Open Graph tags, JSON-LD and crawlable fallback content. So crawlers never see an empty shell. | Live HTML of every route |
| Backend (live) | PHP 8.3 API (`php-backend/api/index.php`) on Plesk (nginx → Apache with `.htaccess`). Data is one JSON file; no MySQL. | `GET /api/health` → `{"backend":"php"}` |
| Backend (alternative) | Node/Express (`server.ts`), same API, used for local development and Node hosting. | |
| Source of the live build | **Open PR [Hackerboy19/fsia-influencer#1](https://github.com/Hackerboy19/fsia-influencer/pull/1)** (`claude/vigilant-cray-j2553c`), not `main`. `main` is the older AI Studio version and still contains the retired word in several places. | The live CSS bundle `index-duQ0VzY0.css` is byte-identical to a build of that branch; the GA ID `G-H2EP91PV1E` and `Last-Modified` time match its last commit. |

Because the live site comes from PR #1, this work is built **on top of PR #1**. Merging this branch therefore also brings in PR #1's changes.

---

## 2. Results at a glance

| Check | Live site today | This branch |
|---|---|---|
| Unknown URLs (e.g. `/this-page-does-not-exist/`) | **200, serves the home page** (soft 404) | 404 with a `noindex` "Page not found" page |
| `/favicon.ico` | 200 HTML (home page) | real icon |
| API responses marked `noindex` | no | `X-Robots-Tag: noindex, nofollow` |
| Retired word in rendered pages, bundles, API data | none found | none found; now also **guaranteed** for future CMS edits |
| WCAG 2.2 AA (axe-core) — 6 pages + 4 dialogs + admin sign-in × 3 screen sizes | 11 failing page/viewport combinations in the first audit (buttons without names; brand-form selects and slider without labels) | **0 violations** |
| Keyboard access to creator profiles | not possible (mouse-only cards) | every card has a button; dialogs trap focus, close on Esc |
| Initial JavaScript | 1,178 KB (316 KB gzip) | 525 KB (160 KB gzip) |
| End-to-end journeys (navigation + all 4 public forms, desktop/tablet/mobile) | — | **132/132 pass** on both PHP and Node builds |

---

## 3. Retired branding

**Live site:** no occurrence in any page's HTML, metadata, JSON-LD, sitemap, robots.txt, the JS/CSS bundles or the public API data (creators, campaigns, plans, settings). The OG image, logo and favicon contain no text with it. The check covered all spellings and cases, plus HTML-entity, percent-encoded and `\u`-escaped forms.

**Gap found:** the clean-up that removed the word from stored content (a) only matched capitalised spellings, leaving lower-case prose, and (b) ran once. Anything an admin typed later in the Content Studio, or an applicant wrote in a bio that was later approved onto the roster, would have been published unfiltered.

**Fix:**
- The rules are now case-insensitive and cover every spelling. Lower-case prose ("stay forever young") becomes "always", so the sentence still reads naturally; brand prefixes and suffixes are dropped.
- A second migration (`debrand_v2`) re-cleans stored content once on the first request after deploy.
- Every public API response (`/api/creators`, `/api/campaigns`, `/api/membership-plans`, `/api/settings`, AI pitch output) is filtered on the way out, in **both** backends. Stored applicant data is not altered.
- `scripts/test-unit.ts` checks 11 tricky inputs, and that PHP and Node produce identical output.

**Where the word still exists, deliberately:** only in code that detects and removes it: `server/db.ts`, `php-backend/api/lib/helpers.php`, `php-backend/api/lib/Store.php` (the old default texts it replaces), and the two test scripts. The PHP files run on the server and are blocked from download by `.htaccess`; none of this reaches a browser.

**Brand name used:** "FSIA Influencer" (as already established on the live site and its domain). No new brand claims were added.

---

## 4. Typography, contrast and readability

- **Faux bold everywhere:** 283 elements use bold Inter, but the 700 weight was never loaded, so browsers smeared a fake bold. It is now loaded, and the font request moved from a chained CSS `@import` to `<head>`, so fonts download in parallel. The unused 300 weights were dropped.
- **Minimum text size** raised from 10 px to 11 px across 228 labels, eyebrows and badges (9 px → 10 px for one). Layouts were re-checked at 375/768/1440 px; three resulting overlaps were fixed (mobile header, talent-card stats, plan badges).
- **Text over the 3D scene:** the "Runway stations", "Roster metrics" and catwalk control panels were 45%-opaque glass over photographs, which put grey text directly on faces. They are now 90% opaque; the glass look is kept.
- **Form labels:** were 10 px grey uppercase; now 14 px semibold near-black, the style the creator form already used.
- **Body text:** page intros and FAQ answers were 14 px grey italic Cormorant (a very light face); now 16–18 px in a darker ink.
- **States:** the membership buttons' hover was white on champagne (≈1.6:1), now dark. Focus rings are now light on dark surfaces (bottom bar, footer, photo viewer), where they were invisible. Disabled and loading states are visible and announced.
- **Reduced motion:** visitors whose device asks for reduced motion now get no springs, bounces or pings.
- **Bottom strip / footer:** design unchanged; links and text measured at AA (white/near-white on #111).

axe reports **0 colour-contrast violations**. It cannot measure text over photos or blur, so those panels were made near-opaque and then checked visually.

---

## 5. Navigation and user journey

| Problem | Fix |
|---|---|
| Logo did nothing on click; a hidden double-click opened Admin | Logo is a real link to the home page |
| "VIP REGISTER" opened the **brand** enquiry form, while creator registration is "Get Verified": creators clicked the wrong one | Renamed **Brand Enquiry** (matching "I'm a brand — enquire" and the footer) |
| Mobile showed three navigations: header tabs, bottom bar and a "Back to Catwalk" floating button | Floating button removed (duplicate of "Explore"; it also covered form fields) |
| Mobile bottom bar and floating button were drawn **on top of** the enquiry/application dialogs | All dialogs render above the page (portal, higher layer) |
| Bottom bar played a chime on every tap even with sound off, creating a new audio engine each time | Uses the site's sound setting; bottom bar items are real links with "current page" state |
| Four mobile icon-only buttons had no names for screen readers | Named ("Play ambient sound", "Admin sign-in", "FSIA Portal (opens in a new tab)", "Brand enquiry") |
| Creator cards could only be opened with a mouse | Each card has a keyboard-reachable button |
| Dialogs had no dialog semantics; Esc did nothing; focus stayed behind the overlay | All 5 overlays: `role="dialog"`, labelled, focus moves in and is contained, Esc closes, focus returns |
| No skip link and no `<main>` landmark | "Skip to main content" is the first Tab stop on every page |

Verified on desktop, tablet and mobile: every header tab, bottom-bar link, footer link, the logo and browser Back reach the right URL, and each page has one visible `<h1>`.

---

## 6. Forms

| Form | Where | Sends to | Required |
|---|---|---|---|
| Brand enquiry | Header "Brand Enquiry", home "I'm a brand", footer, creator profile, Join page | `POST /api/registrations` | brand, email, phone |
| Creator registration (3 steps) | `/join/` | `POST /api/influencer-applications` | name, category, email, phone |
| Campaign application | `/campaigns/` → Apply now | `POST /api/enquiries` (`type: campaign`) | name, email, phone, social handle |
| Membership request | `/membership/` → Enroll | `POST /api/enquiries` (`type: membership`) | name, email, phone |
| Admin sign-in | `/admin/` | `POST /api/auth/login` | (unchanged; passes axe) |

**Changes** (no fields removed, no data schemas changed):
- Every label is associated with its field; required fields are marked and announced.
- One validation rule set for email and phone (10–15 digits, `+`, spaces, dashes and brackets allowed) is shared by the browser, the Node API and the PHP API. The APIs previously accepted any phone text.
- On an error, the message names the problem, the field is flagged `aria-invalid`, and focus moves to it.
- Double submission is blocked: a double click sends exactly one request (tested).
- Failure handling: when the server fails, an error is shown and everything typed is kept (tested with a simulated outage). No form shows a fake success.
- Data loss: the 3-step creator registration keeps a draft through reloads and tab switches, cleared after a successful submit. The registration page no longer auto-focuses the form on load, which skipped the intro and opened the phone keyboard.
- Campaign copy no longer says "Sabyasachi" inside other brands' applications.

**Persistence verified** on both backends: after the browser tests, each submission was read back through the admin API.

---

## 7. Technical SEO and indexing

Already in good shape (kept): HTTPS redirect, `/talent` → `/talent/` 301, unique per-page title, description and canonical, Open Graph/Twitter cards, valid JSON-LD (Organization, WebSite, WebPage, FAQPage), `robots.txt` with sitemap, a sitemap of the 6 canonical indexable URLs only, `noindex` on `/admin/`.

Fixed:
- **Soft 404s.** `.htaccess` sent every unknown URL to the home page with status 200, which Google reports as "Soft 404" or duplicates. Both servers now return a real 404 page (`noindex`, links to every section).
- `favicon.ico` added (it was returning the home page).
- `X-Robots-Tag: noindex, nofollow` on all API responses. The API stays crawlable, so Google can still render pages that load data from it.
- After the app loaded, 4 of 6 pages had no `<h1>` (they used `<h2>`), and creator profile headings skipped a level. Fixed.
- Campaigns title shortened from 68 to 55 characters (it was being truncated).
- Image alt text now describes the person ("Aishwarya Sen, Fashion & Couture creator from Mumbai") instead of repeating keywords; lookbook images lazy-load.
- Core Web Vitals: the Three.js scene and the admin workspace are split into separate files loaded on demand (initial JS −55%), and fonts load in parallel.

Not done (needs your access):
- **Search Console:** I had no access, so nothing was verified, submitted or inspected, and I make no claim about indexing status. The step-by-step guide is in [`DEPLOY.md` → Google Search Console](../DEPLOY.md#google-search-console-indexing): verify the property, submit `sitemap.xml`, request indexing for `/`, `/talent/`, `/campaigns/`, `/join/`, and validate old *Soft 404* entries after deploying.
- FAQPage markup is valid, but Google currently shows FAQ rich results only for authoritative government and health sites, so no rich result should be expected.

---

## 8. Security review

**Scope:** the PHP API that runs the live site, the Node API, the frontend and the release bundle. Two independent reviews were done, one by a separate reviewer working only from the code, plus read-only checks against the live server.

**Already sound:**
- The database, seed, config and PHP library files return 403 on the live server.
- Every admin API route requires a session. Sessions are 256-bit random tokens stored hashed; passwords use bcrypt.
- No cross-site scripting paths: React escapes all output and there is no raw HTML; image URLs are limited to http(s) or embedded raster images.
- No CORS headers, and the public API responses contain no personal data or secrets.

**Fixed:**

| Severity | Problem | Fix |
|---|---|---|
| High | `/DEPLOY.md` was publicly readable on the live site and lists the default admin login. The GitHub repository is public too. | No longer shipped; `.htaccess` blocks `.md` files. **The old copy must be deleted by hand** (see below). |
| High | The default `admin` / `admin123` login worked for every admin API call; only a banner suggested changing it. | The server refuses every admin action until the password is changed, and `admin123` can't be re-used. The panel opens straight on the password form. |
| High | Anyone could bloat `db.json` until PHP ran out of memory, and then the whole API failed, including admin login. Applications took 1.5 MB photos ×13, there were no rate limits, and the AI log was unbounded. The independent reviewer reproduced it with about 14 requests. | Request cap of 1.5 MB, photo cap of 700 KB, portfolio entries must be links, and 12 submissions per 10 minutes per visitor (IPv6 counted per /64). Past 25 MB the forms pause instead of the site failing. |
| Medium | The public AI endpoint spent the site's Gemini API key for anyone. The site itself never calls it. | Admin only. |
| Medium | CSV formula injection in admin exports, e.g. `=HYPERLINK(…)` in a brand name or an enquiry field name. | Cells and headers are neutralised; enquiry detail columns are prefixed. |
| Low | Server errors returned internal messages; the PHP version was exposed; login timing revealed which usernames exist; sessions could slide forever; failed-login records were never pruned. | Generic errors, versions hidden, equal-time login, 7-day maximum session age, pruning. |
| Low (Node only, not live) | Spoofable `X-Forwarded-For`, unchecked nested form fields, and the dev server could serve `server/db.json`. | `TRUST_PROXY` (default: local proxy only), field type checks, dev-server deny list. |

**Verified on the PHP build:**
- The default password returns 403 for admin data, can't be re-used, and changing it unlocks the session.
- An unknown username and a wrong password take the same time to reject.
- A session older than 7 days is refused.
- With `db.json` over 25 MB, the forms answer 503 while the public pages keep working.
- Oversized submissions get 413, the AI endpoint without login gets 401, and the 13th submission in 10 minutes gets 429.

**Needs you (can't be done from the code):**
1. Delete `DEPLOY.md` from the server; extracting a new zip doesn't remove it.
2. Sign in to the admin. If it asks, change the default password **immediately after uploading**: the login is public knowledge.
3. Add the security headers to Plesk's nginx settings (exact lines in `DEPLOY.md` → *Security checklist*). The live HTML pages currently send none.
4. Check that the admin audit log records real visitor IPs, not the server's own.
5. **An old copy of the site is still live at https://fsia-influencer.vercel.app** with the retired branding ("FOREVER STAR INDIA", "Forever Free"). Delete that Vercel project or redirect it to influencer.fsia.in; it also competes with the real site in Google.
6. Optional: move the database outside the website folder (`api/config.php` → `storage_dir`), and consider making the GitHub repository private.

**Not changed:** a Content-Security-Policy would add defence in depth, but it needs careful testing with Google Analytics, Google Fonts and the 3D image textures, so it's left as a follow-up. The admin token lives in the browser's localStorage, which is usual for this kind of app.

---

## 9. Automated tests and how to rerun them

| Command | What it covers | Result on this branch |
|---|---|---|
| `npm test` | Type-check; brand-filter and validation unit tests; Node ↔ PHP parity | pass |
| `npm run audit -- <url>` | Status codes, metadata, canonicals, sitemap and robots, 404s, `X-Robots-Tag`, retired word in HTML/bundles/API/rendered DOM, internal links, horizontal overflow, JS errors, axe WCAG 2.2 AA at 375/768/1440 px on all pages, dialogs and admin sign-in, Esc/focus behaviour | 285 checks, 0 failures (PHP build and Node build) |
| `npm run test:journeys -- <local url>` | Real-browser navigation on 3 screen sizes; every public form: empty/invalid input, server failure, double click, success, draft restore, server-side validation, persistence; security: default-password lock, AI endpoint login, oversized submissions, rate limit, no version leaks | 132/132 (PHP build and Node build) |

`audit` is read-only and safe to run against the live site. `test:journeys` writes test records (`@example.com` addresses), so it refuses to run against anything but a local build.

---

## 10. Deploying

1. `npm run package` → `release/fsia-influencer-live.zip`.
2. Follow [`DEPLOY.md` → Updating to a new version](../DEPLOY.md#updating-to-a-new-version): back up first, extract over the existing files (data in `storage/` is kept), hard-refresh.
3. Run `npm run audit -- https://influencer.fsia.in`. Every check should pass; today the live site fails the four soft-404/`X-Robots-Tag` checks fixed here.

---

## 11. Decisions for you (found, deliberately not changed)

1. **The "FSIA Portal" header button links to www.fsia.in, which prominently shows the retired branding** ("FOREVER STAR INDIA", "Forever Achievers", …). Nothing on this site shows it, but the link sends visitors straight to it. Remove the button, or keep it as an intentional parent-site link?
2. **Pre-ticked consent box** on the campaign application ("I agree to the escrow arbitration protocols…"). It is ticked by default and not stored. Consent under India's DPDP Act should be an affirmative action; I recommend unticked, required, and stored.
3. **No privacy notice** anywhere, although the forms collect names, emails, phone numbers, PAN and GSTIN. I recommend adding a privacy policy page and linking it from the footer and forms.
4. **Unsubstantiated claims in existing copy** (not introduced by this work): "100% secure escrow", "full payment within 24 hours", "contact within 4 business hours", "Premium cover photography in Vogue India", the hard-coded "8.83 Million" roster reach, "India's leading…" in the FAQ. Confirm they are accurate, or let us soften them.
5. The brand form's **"Connect on WhatsApp"** checkbox is not saved anywhere. Store it, or remove it?
6. See §8: delete the old `DEPLOY.md` on the server, change the default admin password if it is still in use, and take down the old Vercel copy.
