# Cleanup.md — What's Polluting Folio, and a Read on the Profile/Share-Card Idea

> Written after a direct pass through the actual `frontend/` and `backend/` source (not just the docs), prompted by "what should I delete" and a proposed Instagram-style profile + shareable card feature.

---

## 1. Fix these first — actual risk, not just clutter

**Hardcoded credentials seeded on every server boot.** `backend/src/app.ts` defines `ensureAdminProfile()`, and `backend/src/index.ts` calls it unconditionally before the server starts listening — no environment check. It inserts an admin user (`admin@folio.com` / `admin123`) and an artist user (`artist@folio.com` / `artist123`) with hardcoded UUIDs directly into whatever database `DATABASE_URL` points to. If that ever points at production, you've shipped a public backdoor login. Gate this behind `NODE_ENV !== 'production'`, or better, delete it once you have real onboarding.

**An unauthenticated static file route.** Same file: `app.use('/scratch', express.static(SCRATCH_DIR))`, serving `backend/scratch/` to anyone who knows or guesses a filename, no auth check. Worth confirming what `printProcessor.ts` and the PSD/IDML services actually write there — if it's ever a guest's photo, an unreleased album export, or a print-ready PDF, it's currently reachable by URL without login.

---

## 2. Your docs describe a backend that doesn't exist

README.md, PRD.md, Architecture.md, Memory.md, and Rules.md all describe **Drizzle ORM** as the data layer — Rules.md even instructs future work to "define database schemas cleanly using `drizzle-orm/pg-core`." The real backend has no `drizzle-orm` or `drizzle-kit` in `package.json`, no Drizzle schema files (the `schema/` folder has one file, `zod.ts` — validation, not ORM), and every query goes through a hand-rolled `query()` wrapper around raw `pg` (`backend/src/db/index.ts`), against 16 hand-written numbered `.sql` migration files.

This isn't cosmetic. It's the reason your own docs told me things about the codebase that turned out to be false, and Rules.md is actively instructing any AI assistant (including me, on a future session) to build a Drizzle layer that isn't there. Pick one: either adopt Drizzle for real, or rewrite the docs to describe the raw-SQL-via-`pg` approach you're actually running. Either is fine — the mismatch is what's costly.

---

## 3. Strong candidates to actually delete

**`frontend/components/templates/adventure-flow.tsx` (70KB) and its page route** (`app/(dashboard)/dashboard/templates/adventure/page.tsx`). "Adventure" is your featured, "#1 bestselling" template in `templates-showcase.tsx` — but the showcase's actual link points to `/dashboard/templates/use/adventure-travel` (the generic template-use flow), not `/dashboard/templates/adventure`. I couldn't find anything in the app that links to that second route. It looks like an earlier, bespoke build-out for the Adventure template that got superseded by the generic template flow and never removed. Worth one repo-wide search for `AdventureFlow` / `templates/adventure` before deleting, but this reads as dead weight.

**Two parallel "page turning" systems.** You have a Three.js-based 3D viewer (`Book3D.tsx`, `Magazine3D.tsx`, `Polaroid3D.tsx` — one per product mode) *and* a separate 2D `FlipBook.tsx` built on `react-pageflip`/`page-flip`. Your own architecture-graph output (`graphify-out/GRAPH_REPORT.md`) flags `PageFlip` as an isolated node with essentially no connections to the rest of the app — a sign it's the leftover of an earlier approach the 3D viewer replaced. Confirm which one is actually shipped in the current preview flow and drop the other.

**`backend/src/utils/idmlParser.ts`.** A second, parallel template-import format (Adobe InDesign IDML) alongside your primary, documented PSD pipeline (`ag-psd`). It's real — wired into `artistRoutes.ts` — but it's not in Rules.md's approved stack, isn't mentioned in Architecture.md at all, and lives entirely inside one 19KB route handler rather than a service. If it's not something artists currently rely on, it's a second file-format parser (with its own edge cases and maintenance burden) for a capability that may not be load-bearing.

**Root-level stray files:** `frontend/" (2).env"` (0 bytes — an empty duplicate from some copy/download), `frontend/.ENV` (duplicate of `.env`, just differently cased), and `graphify-out/` (a ~950KB checked-in dependency-graph report from a code-analysis tool — useful as a one-off artifact, not something that belongs versioned alongside the product going forward).

---

## 4. Not delete, but this is the real "pollution"

The features aren't what's dragging on the app — the file sizes are. These are single files doing far more than one file should:

- `components/artist/artist-dashboard-client.tsx` — 130KB
- `components/admin/admin-dashboard-client.tsx` — 100KB
- `components/album-editor/sidebar.tsx` — 83KB
- `components/templates/adventure-flow.tsx` — 70KB (see above — may just be deleted)
- `components/album-editor/topbar.tsx` — 45KB
- `components/templates/templates-showcase.tsx` — 42KB
- `app/(dashboard)/dashboard/templates/use/[id]/page.tsx` — 35KB

And on the backend, `routes/artistRoutes.ts` (19KB) and `routes/premiumRoutes.ts` (14KB) have real business logic written directly into the route layer instead of delegating to `services/`, which is the opposite of the pattern the rest of the backend follows.

This is the actual answer to "why does it feel polluted": every one of those god-files is a place where a small change carries a big risk of breaking something unrelated, which is exactly the feeling of a codebase that's accumulated cruft even when no single feature is obviously wrong. Splitting the two dashboard clients and the editor sidebar/topbar into smaller, purpose-specific components would do more for the app's health than any single deletion above.

---

## 5. The Instagram-profile + shareable-card idea

The instinct is good — a personalized, good-looking card that existing users post on their own Instagram/WhatsApp is a real, proven growth loop (Spotify Wrapped, Duolingo streak cards, BeReal's "on this day" — all the same mechanic: something specific to *you*, styled well enough to be worth sharing, with a quiet link back). You already have the seed for it: a `profiles` table and `profileRoutes.ts` exist, they're just minimal right now.

A few things worth weighing before building it:

**Don't build the full Instagram clone.** A feed, follows, likes, comments, and DMs is a completely different product with its own moderation and safety burden — and given what's above (Polaroid, Adventure, Premium all partially wired up in parallel already), a full social layer is exactly the kind of thing that risks becoming the next half-built island rather than shipping well. The growth mechanic you actually want — "people see a beautiful card and want one too" — doesn't require a feed or follower graph, just a public profile page and a card generator.

**Where it fits best.** This is a stronger fit for photographers/artists (a public portfolio profile with a shareable "artist card" showing their best album work — directly monetizable, drives new client bookings) than for every event guest. For guests, the natural version is closer to the "story engine" and "People's Cut" ideas from the earlier feature doc: a personalized card generated from *their own* face-matched photos and moments at a specific event ("You were in 34 photos at Priya & Arjun's wedding"), not a general-purpose social profile.

**Consent is the real design constraint here, not an afterthought.** The photos behind this feature come from AI face-matching at someone else's event — other people are very likely in frame. Before this can be a "share to your own Instagram" feature, the person sharing needs to pick/crop which image becomes their card (not have one auto-selected from a group shot), and anyone else recognizable in it needs to not be identifiable without their own consent. This is the same privacy tension flagged in the earlier "privacy-first face matching" idea — a viral share feature and a privacy-first pitch can both be true, but only if the sharing flow is built around active, photo-level consent rather than auto-posting whatever the algorithm picks.

**Make it visually load-bearing.** Given "Editorial Darkroom" is already your visual identity, the card should look like a fashion-editorial spread or magazine cover pulled from the album itself — not a generic badge — so that when it's reposted, it's recognizably *Folio's* aesthetic and reinforces the brand every time it's shared, the same way a Spotify Wrapped card is unmistakably Spotify's before you even see the logo.

---

## 6. Suggested order of operations

Before adding the profile/card feature, I'd spend a short pass on: fixing the seeded-credentials issue, deciding Drizzle vs. raw `pg` and making the docs match reality, and confirming `adventure-flow.tsx` is actually dead weight before removing it. That gives the new feature a clean, honest foundation instead of becoming one more parallel branch next to Polaroid, Adventure, and Premium.
