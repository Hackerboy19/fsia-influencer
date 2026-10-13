# FSIA Influencer — Forever Star India

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

## Admin panel

- **Overview:** live counters, new-lead / pending-applicant badges, audit trail
- **Content Studio / Creator Roster / Brand Bookings:** manage categories, creators, campaigns and membership plans
- **Campaign Copy / AI Config / Prompt Logs:** site text and colours, Gemini settings and history
- **VIP Applications:** brand leads with search, status pipeline (new → contacted → confirmed → closed), notes, CSV export
- **Creator Applicants:** approve straight onto the runway, decline, delete, search, CSV export
- **Security & Data:** change password, admin team accounts, backup / restore, searchable audit log
