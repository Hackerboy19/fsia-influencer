# Reference-mockup redesign, 27 October 2026

Builds on PR #6 (branch `claude/project-thread-14szo2`). New branch, so it gets its own Vercel preview. Same routes, APIs, data and forms.

## Inventory before changes

Routes: `/` home, `/talent/` directory (+ `?profile=slug`, `?q`, `?category`, `?city`), `/gallery/` 3D gallery (Three.js), `/campaigns/`, `/join/` award application, `/membership/`, `/star-india/`, `/green-light/` guides + Explore Magazine bookings, `/faq/`, `/contact/`, `/privacy/`, `/admin/`.
Features: brand enquiry dialog, saved-photo shortlist (moodboard), profile panel, award application form, campaign applications, magazine booking form, admin workspace.

Mockup items that do **not** exist and were not faked:
- **Login**: there are no creator or brand accounts, only the admin login at `/admin/`. No public Login button was added.
- **Awards page**: the award lives on the home page (`/#the-award`) and the application at `/join/`. "Awards" in the menu links to that section; no duplicate route.
- **Categories / Resources / For Brands / For Creators**: no separate pages; they are dropdowns that link to real pages and filters.
- Brand logos, "500+ creators", "2.1M reach", verified ticks on every card, magazine article dates: not used. Counts come from the data, the tick shows only on profiles marked Reviewed (never on preview samples), and guides show read time because they have no publication dates.

## What changed

| Area | Change | Files |
|---|---|---|
| Design system | Bronze filled primary buttons (`--color-bronze-fill` #94652A, 5:1 with white), `.btn-dark`, ivory hero well, `.page-wide` (1408px) for home/header, `.h-display`, `.h-block` sans section titles, `.card`, `.see-all`, `.icon-dot`, nav/dropdown styles | `src/index.css` |
| Header | New component. Home, Discover Creators, Categories ▾ (real categories with counts), 3D Gallery, Magazine, Awards, Campaigns, For Brands ▾, For Creators ▾, Resources ▾, search button (dialog → `/talent/?q=`), Apply for the award. Full bar from 1360px; below that a grouped menu dialog. Escape/outside click closes dropdowns; focus trapped in dialogs | `src/components/SiteHeader.tsx`, `src/App.tsx` |
| Section links | `goTo({tab, hash})` scrolls to a section after navigation (`/#the-award`, `/green-light/#guide-…` opens that guide); direct links with a hash work too | `src/App.tsx` |
| Home hero | H1 keeps "Influencer Award" (kicker) + "Discover Creators. Build Meaningful Collaborations."; search; real category shortcuts; real counts (profiles, categories, cities) + Free to apply + Registration open; lead portrait and three framed prints are real directory profiles; For brands / For creators dark cards | `src/components/HomeTab.tsx` |
| Feature strip | Discover Creators, 3D Gallery, Magazine, Awards, Campaigns, each to the real page | `HomeTab.tsx` |
| Featured creators | Scrollable cards: photo, save-photo button (existing shortlist), name, Reviewed tick when true, niche, city, self-reported reach, platform icons from the profile's "Platforms" field; View all creators | `HomeTab.tsx` |
| From the Magazine | Typographic Green Light cover for the lead guide + three more guides | `HomeTab.tsx` |
| Categories | Category cards with a real profile photo and real count; city links | `HomeTab.tsx` |
| 3D gallery preview | Light CSS-3D coverflow of real portraits (arrows, swipe, click), Open 3D Gallery. Three.js still loads only on `/gallery/` | `HomeTab.tsx`, `index.css` |
| Bottom cards | "Be part of the next feature" → magazine booking form; award card → apply / award section | `HomeTab.tsx` |
| Kept | For creators steps, For brands steps, "What Reviewed means", award details with Confirmed / Optional benefits, anti-fraud note | `HomeTab.tsx` |
| 3D gallery | Dark hall (floor, columns, fog, light labels), dark control panels, still scene for reduced-motion users | `ThreeGallery.tsx`, `App.tsx` |
| Magazine page | Featured guide with cover and full text; other guides in a two-column editorial list that opens in place; booking unchanged | `GreenLightTab.tsx` |
| Tests | Journey test follows the new menu labels and dropdowns | `scripts/test-journeys.mjs` |

## Checks run (this sandbox)

- `npm test`: pass. `npm run build`: pass (all routes prerendered, sitemap, robots).
- Screenshots served like a Vercel preview (no API, sample profiles) at 1440, 1280, 768, 390 and 360 px: no horizontal scroll.
- Clicked through: dropdowns, search dialog (→ `/talent/?q=Mumbai`), Awards (→ `/#the-award`, scrolled into view), guide links (open the guide), direct `/#for-brands` load.
- "Forever": not in any built page. Google tag `G-H2EP91PV1E` unchanged.
- 3D gallery: the sandbox's software WebGL is too slow for live screenshots; a single frame was captured with animation stopped. Please check the preview.
- Photos: Unsplash is blocked here, so screenshots use plain placeholder portraits.

## Needs Boss

- Login: should creators/brands have accounts? That is a new backend feature, not a design change.
- Real photos and profiles show only on the live site (preview uses labelled samples).
