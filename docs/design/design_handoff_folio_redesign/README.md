# Handoff: Folio Visual Redesign — "Editorial Darkroom" (7 core screens)

## Overview
A full visual-direction pass for Folio (event-photography / album-design / print app), covering: Library & Events, Guest Join & Face-Match, Styles Gallery, Editor, 3D Album Preview, Ask an Artist, Profile & Cards. Builds on the product's existing "Editorial Darkroom" brand tokens (found in the codebase's `frontend/app/globals.css` and `docs/Design.md`), disciplined with a stricter editorial/print grid: strong rules instead of shadows, flush-left labels, 4px max radius, monospace used for all technical metadata.

## About the Design Files
The file in this bundle (`Folio Redesign.dc.html`) is a **design reference built in HTML** — a single scrollable document showing all 7 screens as static mockups with annotated "Fig." captions explaining the intent and reference points for each. It is not production code. The task is to **recreate these designs in Folio's actual codebase** (Next.js/React, per `frontend/`) using its existing component patterns, Tailwind setup, and CSS variables — not to ship this HTML directly. Image placeholders (dashed boxes) mark where real photography goes; do not treat them as final assets.

## Fidelity
**High-fidelity.** Colors, type choices, spacing rhythm, and grid discipline are intentional and final. Exact pixel positions are illustrative (this is one long reference doc, not a responsive spec) — follow the described layout structure and token values precisely, but adapt breakpoints/exact pixels to the real app's grid.

## Design Tokens

Colors (both modes; CSS var names as used in the mockup):
- `--bg` Daylight `#F5F0E8` (aged paper) / Darkroom `#1C1814` (near-black, warm)
- `--surface` Daylight `#FDFAF5` / Darkroom `#252019`
- `--surface2` Daylight `#F5F0E8` / Darkroom `#2F281F`
- `--ink` Daylight `#1C1814` / Darkroom `#F5F0E8`
- `--ink-soft` (muted text) Daylight `#7A6F64` / Darkroom `#A79C8E`
- `--primary` (terracotta) `#B85C38` — primary-ink `#FDFAF5`
- `--secondary` (bottle green) `#3A7D6E` — secondary-ink `#FDFAF5`
- `--border` (linen) Daylight `#DDD8CE` / Darkroom `#3A342B`

Type:
- Titles/editorial moments: Georgia (serif)
- UI/body: Inter
- Technical metadata (dimensions, DPI, order IDs, timestamps, spec stamps): monospace (ui-monospace/Menlo), always uppercase with letter-spacing ~0.06–0.15em

Radius: **4px max everywhere.** Never round-xl or round-full on cards/containers. Circular avatars/QR-adjacent elements are the only 50% radius use.

Rules: 1–2px solid borders in `--border` divide sections; no drop-shadow-based card elevation except the Polaroid style block (a deliberate one-off) and cast shadow under the 3D album.

## Screens

### 1. Library & Events
- Two-column layout: main content (grid-template-columns `1fr 300px`), right column is a sticky "Fig." didactic card.
- **Library**: dense uniform grid, 8 columns, 2px gutters, no captions — like a contact sheet. Mono label above: "LIBRARY — PRIVATE, N PHOTOS".
- **Event**: bordered card container. Header row: italic serif event title + mono date/location/count line, contributor initials as small circle avatars overlapping -8px. Below: date-clustered mono labels ("CLUSTER — 8:12PM") each followed by a photo row — first cluster is an asymmetric 2fr/1fr/1fr triptych, second is a uniform 5-col row.
- Distinction is carried by grid rhythm and metadata density only — no "shared" badge/icon.

### 2. Guest Join & Face-Match
- Three phone-width cards (300px) in a horizontal scroll row, left column; sticky Fig. card on right.
- **Card 1 (join)**: registration-cross corner marks (SVG plus-in-circle motif, reused throughout), mono "INVITATION INSERT" label, italic serif couple names, mono date line, a QR-code-style dot grid, "Scan to find your photos" caption.
- **Card 2 (matching)**: dark (`--ink`) background regardless of global theme. Circular selfie photo ringed by a pulsing terracotta border (`loupePulse` keyframe: box-shadow ring pulses 0→8px→0 every 1.8s). Mono readout "MATCHING… N FRAMES".
- **Card 3 (reveal)**: serif headline "N photos found you", mono subcaption, then 3 photo rows staggered with decreasing width/increasing left-margin and a `slideSleeve` entrance animation (translateX+rotate, staggered 0.1s delays) — mimics prints sliding into a sleeve.

### 3. Styles Gallery
- Asymmetric grid: `grid-template-columns: 2fr 1fr 1fr`, 2 rows. Each style has its own distinct visual idiom (not a shared card shell):
  - **Wedding**: spans both rows (cover-feature slot), dashed inner border, serif centered caption below photo, mono "ENGRAVED · SERIF · IVORY MAT" tag.
  - **Polaroid**: literal polaroid frame — white/cream card, thick bottom margin, drop shadow, italic serif caption sitting in the bottom white margin over the photo.
  - **Travel**: bordered card, mono "TRAVEL" label + compass-rose SVG icon (circle + cross), bottom-right.
  - **Adventure**: spans 2 columns, black background, film-sprocket dots down the left edge, mono "ADVENTURE" + "✂ CROP — GREASE PENCIL" annotation in terracotta.

### 4. Editor
- Fixed-height (520px) 3-pane tool shell, bordered, no drop shadows:
  - **Left rail (64px)**: vertical stack of page thumbnails (2px border boxes) with mono page numbers below each; selected page gets `--primary` border.
  - **Center canvas**: top strip (30px) is a mono technical readout only — "SPREAD 03/12", "3000×2400px", "300 DPI", "SAVED 2s AGO" — no icon toolbar. Below: the spread itself on a `--bg` stage, selected frame gets a 2px `--primary` border + small solid corner tab.
  - **Right rail (180px)**: "SELECTED — FRAME" mono label, then 3 label/value rows (Crop, Mat, Layer) in Inter/mono — no more than what's needed for the current selection.

### 5. 3D Album Preview
- Full-bleed dark (`--ink`) stage, 520px, with a registration-cross SVG at each of the 4 corners (circle + crosshair, semi-transparent).
- Album cover center-stage, `perspective(1400px) rotateY(-18deg)` for a tilted 3D look, `drop-shadow` cast shadow, a thin gradient down the right edge to suggest page thickness.
- Bottom-left: mono spec stamp ("24 SPREADS · 12×12in", "PEARL LUSTRE STOCK", "LINEN COVER"). Bottom-right: solid terracotta "ORDER PRINT →" button, sharp 2px radius, mono label.

### 6. Ask an Artist
- Single bordered card, generous padding (32px).
- Header row: artist portrait (square, not circular), serif name, mono credential line in `--secondary` ("WEDDING & PORTRAIT · 9 YRS · 214 ALBUMS DESIGNED").
- "RECENT WORK" mono label + 5-across portfolio thumbnail strip.
- Brief prompt: italic serif quote-style line with a left `--primary` border rule (not a boxed label+input), followed by a plain bordered textarea-style box.
- Footer row: mono "EST. TURNAROUND" pill (bordered, not filled) on the left, solid dark "SEND COMMISSION" button on the right.

### 7. Profile & Cards
- Masthead: serif name at 44px, mono credit line below ("@handle · GUEST OF N EVENTS · MEMBER SINCE YEAR"), bottom border in solid `--ink` (heavier than the linen border used elsewhere).
- 4-across published-album grid below.
- "SHARE CARDS — 1080×1350" mono label, then two card mockups at 4:5 aspect ratio, 230px wide:
  - **General profile card**: paper-field background, hero photo bleeding on 3 edges (small margin only at top), mono handle caption below.
  - **Occasion card**: the one place the terracotta `--primary` fills the entire card as a solid field; circular photo centered like a locket with a thick white/cream ring border; serif "N Years" headline in cream; mono date below; single registration-cross mark top-right as the only ornament. This cross + mono credit line pattern should repeat across all occasion cards so they're recognizable as Folio's before the logo is visible.

## Interactions & Behavior
- Global Daylight/Darkroom toggle (top-right of the doc) swaps all CSS custom properties on the root container; dark mode is a distinct "actual darkroom" palette, not an inverted light mode.
- `loupePulse` keyframe (guest join, card 2): animates box-shadow ring, 1.8s ease-in-out infinite.
- `slideSleeve` keyframe (guest join, card 3): entrance animation, opacity 0→1 + translateX(28px)→0 + rotate(2deg)→0, staggered per row.
- Didactic "Fig." caption cards can be toggled on/off (documentation aid, not part of the shipped UI).

## State Management
This is a static visual reference — no real state beyond the two UI toggles above. The actual implementation will need: Library vs Event photo data with capture-time clustering, guest face-match flow state (idle → scanning → matched), editor canvas selection state, artist commission form state, and profile/card data.

## Assets
All photography is placeholder (dashed-box `<image-slot>` placeholders) — no real photos are included. Replace with real event/portrait/product photography before shipping; the design depends on photography quality (it's meant to carry each screen).

## Files
- `Folio Redesign.dc.html` — the full 7-screen design reference (open directly in a browser)
- `image-slot.js` / `support.js` — supporting runtime files used only to render the placeholder image slots and template bindings in this prototype; not needed in the production app
