# Prompt: Folio Redesign Brief (for Claude / any design-capable AI)

> Copy everything below the line into a fresh conversation with the design AI. It's self-contained — it doesn't assume the AI has seen this project before.

---

You are art-directing a complete visual redesign of **Folio**, an event-photography, album-design, and print-publishing app. Guests get AI face-matched galleries from weddings and events, hosts and photographers build albums in a canvas editor or hand them to an artist, and finished albums get previewed in 3D and ordered as physical prints. Your job is to make every screen look like it was made by people who love photography and print craft — not like a generic AI-generated SaaS dashboard.

Read this whole brief before producing anything. Where it gives you a rule, follow it exactly. Where it gives you a reference, look at the actual thing, don't approximate it from memory.

## What you're designing around

The app has three sections, and everything you design has to live inside one of them:

- **Photos** — where every photo lives. *Library* is all of someone's images, private by default. *Events* are spaces someone creates around an occasion, trip, or person — sometimes shared with a group, sometimes just for themselves.
- **Create** — turning photos into something: an album, a single print, a designed card. *Styles* is a gallery of looks to start from. *Editor* is a canvas tool to build it yourself. *Ask an Artist* hands it to a real photographer/designer. *Orders* tracks prints.
- **Profile** — a public page per user, and shareable, occasion-based cards designed to be posted on Instagram/WhatsApp by the people who made them.

Plus a role-gated **Artist Studio** for photographers managing client work.

## The existing brand foundation — build from this, don't replace it

The product already has a direction called "Editorial Darkroom": the tactile warmth of a film darkroom crossed with a modern studio. Use these tokens as your literal starting palette, not inspiration to loosely riff on:

- Background `#F5F0E8` (aged, unbleached paper) / Ink `#1C1814` (near-black, warm not cold)
- Primary `#B85C38` (worn terracotta) / Secondary `#3A7D6E` (bottle green)
- Card surface `#FDFAF5`, border `#DDD8CE` (linen), muted text `#7A6F64` (pencil gray)
- Dark mode inverts to the darkroom ink as background — treat dark mode as an actual darkroom, not an inverted light mode.
- Type: serif (Georgia-class) for titles and editorial moments, Inter for UI and body, a monospace for technical metadata — `3000 x 2400 px @ 300 DPI`, order numbers, timestamps — treated as a deliberate design element, the way a contact sheet or a film canister prints its specs.
- Radius `4px` everywhere. Sharp, editorial, almost-square. This is a rule, not a default — if you reach for `rounded-xl` or `rounded-full` on a card, stop.

Push this further with real reference points, and say which ones you're pulling from as you work: contact sheets and darkroom proof sheets, gallery wall didactics (the little printed cards next to framed photos), Japanese photobook design (Nakahira, Araki-era book layouts — generous negative space, deliberate asymmetric grids, type that never competes with the image), Kinfolk/Cereal-era editorial magazine layout, letterpress wedding stationery (deckled edges, embossing, registration marks as a motif), and vintage Kodak/Polaroid packaging specifically for anything in the Polaroid style. The print heritage of this product is a gift — use crop marks, bleed guides, and registration crosses as actual decorative language somewhere, not just as literal print-export UI.

## What "not vibe-coded slop" means, specifically

Do not produce any of the following. These are the exact tells of generic AI-generated product design, and this brief exists to keep them out:

- Purple-to-blue gradients, or purple as an accent color at all
- Glassmorphism, frosted blur panels, neumorphism, soft pastel gradient blobs behind hero text
- A generic sidebar-plus-cards-plus-drop-shadow dashboard that could belong to any SaaS product
- Centered hero section with a gradient background and a bold sans headline — the single most overused AI-generated layout
- Rounded-xl-everything with soft shadows on every card
- Stock photography, or any photography that doesn't look like it came from an actual event
- Emoji used as icons
- Uniform fade/slide-up animations on every element with no variation or intent
- Generic icon-in-a-circle feature grids
- Type hierarchy that's just "make it bigger and bolder" instead of a considered scale

## What to actually do instead

- Let real photographs be the hero of nearly every screen. This is a photography product — the UI's job is to frame images well, not compete with them. Generous margins around photography, like a print mounted in a mat.
- Build on an editorial grid — asymmetric column layouts borrowed from print magazines, not a centered 12-column SaaS grid. Break the grid deliberately sometimes; never accidentally.
- Give motion mechanical, physical intent tied to the metaphor: a page-turn should feel like paper, not like a generic slide transition; a photo selecting into an album should feel like sliding a print into a sleeve; a face-match "guest found" moment should feel like a contact-sheet loupe landing on a frame, not a generic spinner-then-checkmark.
- Design real empty states, real loading states, and real error states with the same care as the happy path — an empty Library before a guest's first photo lands is a moment to get right, not an afterthought.
- Use the monospace treatment for anything technical (dimensions, DPI, order IDs, timestamps) consistently, the way a photo lab actually stamps a print.
- Every screen should be able to answer "what specific reference informed this," even if the answer is small. If you can't name one, redesign it.

## Screens to actually design (in this order)

1. **Library & Events (Photos)** — how a grid of hundreds of photos from one event stays browsable and calm, not a generic thumbnail wall. How a private personal Library visually differs in feel from a shared Event space, even though it's the same underlying UI.
2. **Guest join & face-match moment** — the single most emotional screen in the product: a stranger scans a code, takes a selfie, and gets handed their photos from someone else's most important day. Make this feel like a gift being handed over, not a form being submitted.
3. **Styles gallery (Create)** — browsing looks (Wedding, Travel, Polaroid, Adventure) needs to feel like flipping through a real album-design catalog, each style visually distinct enough that you'd recognize it from a thumbnail alone.
4. **Editor** — the canvas tool. Respect that this is a professional tool used for real client work; the chrome around the canvas should get out of the way, and the few controls that exist should feel considered, not default-shadcn.
5. **3D album preview / flipbook** — this is the emotional payoff screen, where a finished album becomes tangible before it's printed. Push the physicality here harder than anywhere else in the app.
6. **Ask an Artist** — this needs to feel like commissioning a real photographer, not filing a support ticket. Warmth and craft over "concierge" corporate polish.
7. **Profile & Cards** — the public page and the shareable, occasion-triggered cards. These need to be instantly recognizable as Folio's when reposted on someone else's Instagram, the way a Spotify Wrapped card is unmistakable before you even see the logo. Design at least two: a general profile card and one festival/occasion card (e.g. an anniversary or a seasonal occasion).

## What I want back

For each screen above: a description of the layout and hierarchy specific enough that a developer could build it without guessing, the exact reference points you drew from, and what makes it distinct from a generic version of the same screen. If you can produce actual mockups, static HTML, or component code, do that — but the written art direction matters as much as the pixels, because it's what keeps the next hundred screens this product needs consistent with the first ten.

Where you're uncertain between two directions, show both and argue for one — don't default to the safer, blander option to avoid a wrong answer.
