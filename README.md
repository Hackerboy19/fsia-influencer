# FSIA Influencer — Creators & Influencer Portal

3D editorial gallery, creator directory, brand campaigns, membership plans and a
full admin panel for [influencer.fsia.in](https://influencer.fsia.in).

## Stack

- **Frontend:** React 19 + Vite + Tailwind CSS 4 + Three.js (`src/`)
- **Backend (two interchangeable implementations of the same `/api`):**
  - `server.ts` — Node/Express, used for local development (`npm run dev`) and Node hosting
  - `php-backend/` — PHP, used for the live site on shared hosting
- **Storage:** a single JSON file (`server/db.json` for Node, `storage/db.json` for PHP),
  seeded from `server/db.ts`

## Development

```bash
npm install
npm run dev          # http://localhost:3000 (Vite + Express API)
npm run lint         # TypeScript type-check
```

Default admin login: `admin` / `admin123` (the panel forces you to change it).

## Tests and audit

```bash
npm test                                   # type-check + unit tests (brand filter, validation, Node ↔ PHP parity)
npm run audit -- http://127.0.0.1:8080     # SEO, status codes, 404s, branding, links, WCAG 2.2 AA (axe) at 3 screen sizes
npm run test:journeys -- http://127.0.0.1:8080   # navigation + every public form, end to end, in a real browser
```

`audit` is read-only and can also be pointed at the live site. `test:journeys` submits test
enquiries (example.com addresses), so it refuses to run against anything but a local build
with a fresh database (it ends by triggering the 12-per-10-minutes submission limit).
Both use Playwright's Chromium (`npx playwright install chromium` once if it is missing).

## Build the live-site bundle

```bash
npm run package
```

Creates `release/fsia-influencer-live.zip` (static frontend + PHP API) ready to
extract into the site's web root. See [DEPLOY.md](DEPLOY.md) for the step-by-step guide.

To test the bundle locally:

```bash
php -S localhost:8080 -t release/fsia-influencer-live php-backend/dev-router.php
```

## SEO

`src/seo.ts` is the single source for page URLs, titles, descriptions and structured data.
`scripts/prerender-seo.ts` runs after `vite build` and writes one HTML file per route
(`dist/talent/index.html`, …) with complete meta tags and crawlable fallback content,
plus `robots.txt`, `sitemap.xml` and a `noindex` `404.html` that both servers return with a
real 404 status for unknown URLs (no soft 404s). In the browser the same data keeps `<head>` in sync
as visitors move between sections.

## Admin panel

Open `/admin/` directly (visitors see no admin button). New creator applications carry a content
category (a fixed list plus "Other"); the admin picks the runway section when approving.

- **Overview:** live counters, new-lead / pending-applicant badges, audit trail
- **Content Studio / Creator Roster / Brand Bookings:** manage categories, creators, campaigns and membership plans
- **Campaign Copy / AI Config / Prompt Logs:** site text and colours, Gemini settings and history
- **VIP Applications:** brand leads with search, status pipeline (new → contacted → confirmed → closed), notes, CSV export
- **Creator Applicants:** approve straight onto the runway, decline, delete, search, CSV export
- **Enquiries:** campaign applications and membership plan requests from the public site
- **Security & Data:** change password, admin team accounts, backup / restore, searchable audit log
