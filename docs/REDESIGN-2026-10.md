# Redesign, October 2026: audit and decisions

## What made the old site look template-generated

- A navy-and-gold "award gala" look on every block: gradients, gold shimmer text, sparkles (✦), trophies, ribbons and glow.
- Very large rounded containers (20–40px radius) and the same dark card pattern repeated on every page.
- A three-slide hero carousel with an oversized headline ("Best Indian Influencer Award Agency & Company").
- Statistics that were computed or invented rather than measured: "8.83 Million combined roster reach", "100% Secure Audited Contracts", "FSIA-SHA256-ACTIVE", "Combined audience 8.8M+".
- Fabricated content: five hard-coded "extra" directory profiles (one using a real actress's name), hard-coded campaigns naming Sabyasachi, Taj, Vogue India and OnePlus, an "Influencer ID" number generated from each name, a mock magazine cover with a creator's photo, and "AUDITED: YES" under every FAQ.
- Unsupported claims: escrow, payment "within 24 hours", "India's leading elite networking platform", daily API audits of follower data.
- Approval steps that filled blank fields with invented values (city "Mumbai", 100K followers, 5.0% engagement, a stock photo, "Elegance is standard.").
- Header with eleven controls, an ambient synthesiser, a floating mobile bar and decorative "prism" widgets.

## Design system

| | |
|---|---|
| Type | Newsreader (display, headings only) + Instrument Sans (UI and body) |
| Colour | Paper `#F7F5F0`, surface `#FFF`, ink `#1B1A17` / `#45423C` / `#625E56`, hairline `#E2DDD3`, one accent: bronze `#7A5A22` (from the champagne logo mark) |
| Shape | 2–4px corners on controls and images, 8px maximum on panels, hairline borders, almost no shadow |
| Layout | 1200px content width, 20/32px gutters, sections step 56–80px |
| Components | `.btn` / `.btn-primary` / `.btn-secondary`, `.eyebrow`, `.h-page`, `.h-section`, `.lede`, `.link`, `Photo` (fixed ratio, initials fallback) |

Defined in `src/index.css` (`@theme` tokens and `@layer components`).

## Trust rules now in the code

- Profiles show only what the creator or admin entered. Empty fields are hidden, never filled.
- Older filler text from previous approval code is hidden on the public site (`src/lib/profile.ts`).
- "Reviewed" means the team approved the application. Audience figures are labelled as supplied by the creator.
- No sample data is shown as real: if the API cannot be reached, a notice says sample profiles are shown.
- Campaigns and membership plans come only from the API; no hard-coded fallbacks.
- Every profile has a correction link that pre-fills the contact form.

## Business information still needed (not invented)

1. Final public brand name (currently "FSIA Influencer", one constant in `src/content/brand.ts`).
2. Privacy policy and terms of use (none exist in the project, so the footer does not link to any).
3. A public contact email or phone, if you want one shown (the site uses the contact form; `partner@fsia.in` appears only in a server error message).
4. Exactly what the team checks before approving a profile, so the "Reviewed" explanation can be precise.
5. Whether every published profile has won the award (profiles no longer claim it individually).
6. The campaigns and plans stored in the live database: the seed data names Sabyasachi, Taj, Vogue India and OnePlus and mentions escrow and "guaranteed" pitches. Delete or edit any that are not real in Admin.
7. Whether profile owners should be able to add social links (there is no field for them today).
