# 🃏 CardSystem.md — the template-driven card engine

Cards live in the **Profile** tab. A card is one person's life at a glance —
a photograph, their name, and the few things they would actually mention —
rendered at Instagram and WhatsApp sizes and exportable as an image.

The point of this document is the architecture, not the feature list. There is
exactly **one renderer**. There is no `CinematicCard.tsx`, no `MinimalCard.tsx`,
and adding a template does not add a component.

---

## 1. The one rule

```
Template configuration  +  Base style  +  Profile data  +  Customisation
                                  ↓
                            CardRenderer
                                  ↓
                             Final card
```

Every visual decision arrives as **data from the backend**. Publishing
"Retro Film" from the admin panel puts it in every user's template picker,
correctly previewed, with no frontend deploy.

If you find yourself writing a component whose name is a template's name, the
design has gone wrong. Extend the [component registry](#5-component-registry)
instead.

---

## 2. The pieces

| Concept | Lives in | What it decides |
|---|---|---|
| **Base style** | `card_styles` | Palette, type roles, spacing, radius, film treatment. Knows nothing about layout. |
| **Template** | `card_templates` | Catalogue entry: name, category, default style, status. |
| **Template version** | `card_template_versions` | The layout document. Immutable once written. |
| **Card profile** | `card_profiles` | The richer self-description a card draws on. One per user, shared by all their cards. |
| **Card** | `cards` | One user's binding of a template version + a style + their own customisation, with a snapshot of the profile it was built from. |

Because style and layout are separate, **Editorial + Paper** and
**Editorial + Darkroom** are the same rows in `cardTemplates.ts`. Seven styles
across twelve templates is eighty-four looks from twelve layouts.

---

## 3. Where the code is

```
backend/src/
├── schema/cardSchema.ts        # zod — the authority on what may be stored
├── services/
│   ├── cardStyles.ts           # the shipped base styles
│   ├── cardTemplates.ts        # the shipped templates
│   ├── cardCatalog.ts          # boot-time sync + legacy share_cards import
│   └── cardService.ts          # catalogue, cards, capability enforcement
├── routes/cardRoutes.ts        # wiring only
└── migrations/018_card_system.sql

frontend/
├── lib/cards/
│   ├── types.ts                # what the renderer may receive
│   ├── resolver.ts             # {{profile.name}} — safe, never eval
│   ├── style.ts                # four-layer token merge
│   ├── text.ts                 # measurement and line breaking
│   ├── context.ts              # the engine ↔ component contract
│   ├── layout.ts               # measure / arrange
│   ├── registry.tsx            # every component, and nothing else
│   ├── export.ts               # SVG → PNG / JPEG
│   └── api.ts                  # the client
├── components/cards/
│   ├── card-renderer.tsx       # THE renderer
│   ├── card-editor.tsx         # the five-step editor
│   ├── card-rail.tsx           # a row of cards
│   ├── public-card.tsx         # a shared card link
│   ├── controls.tsx            # the editor's form vocabulary
│   └── panels/                 # template · words · style · add · share
└── app/
    ├── (app)/profile/cards/                 # gallery
    ├── (app)/profile/cards/[cardId]/        # editor
    ├── (app)/admin/cards/                   # template & style management
    └── card/[slug]/                         # a public share link
```

---

## 4. Why SVG

The renderer emits SVG, not HTML. Three things follow, and they are the
reason:

1. **One document scales.** A 1080×1350 card in canvas units renders at 240px
   in a gallery cell and rasterises at 3240px for print with no relayout.
2. **Export is not a second renderer.** `exportCardBlob` takes the very `<svg>`
   node the user has been looking at, inlines the photographs as data URIs and
   draws it into a canvas. What you saw is what you get, because it is the same
   document.
3. **Line breaks are decided once.** SVG will not wrap text, so the engine
   measures and breaks it — which means the preview and the export break
   identically instead of hoping two layout systems agree.

The cost is that there is no flexbox, which is why `layout.ts` exists.

---

## 5. Component registry

`lib/cards/registry.tsx` maps a `type` string to a spec:

```ts
interface ComponentSpec {
  label: string
  measure(props, ctx, available, node): { width, height, meta } | null
  render(placed, ctx): ReactNode
  content?: { prop: string; kind: 'text' | 'lines'; label: string }
  imageProp?: string
}
```

`measure` answers *how much room do you need in this width*; `render` draws
into the rectangle the engine hands back. **A component never positions
itself.** Returning `null` from `measure` removes the node entirely, and the
stack above closes the gap — that is how an empty quote leaves no hole.

Declaring `content` is what makes a component's words appear in the editor's
Words panel. There is no separate list of editable fields to maintain.

### Adding one

1. Add the spec to `COMPONENTS` in `registry.tsx`.
2. Add its name to `COMPONENT_TYPES` in `backend/src/schema/cardSchema.ts`.

Every existing template can now use it.

---

## 6. Data binding

```
{{profile.name}}
{{profile.photos[0].url}}
{{profile.interests | take:3 | join: · }}
{{profile.username | prefix:@}}
{{profile.name | default:Your name | upper}}
```

`resolver.ts` is **not an expression language**. No `eval`, no `Function`, no
operators, no property access that is not a plain identifier or an array index;
`__proto__`, `prototype` and `constructor` are refused outright. A binding that
resolves to nothing renders as nothing.

When a prop is *exactly one* binding it resolves to the **raw value**, which is
how `source: '{{profile.interests}}'` reaches a component as an array while
`value: 'by {{profile.name}}'` reaches it as a string.

---

## 7. Layout

Two passes, because `flex`, `justify: between` and vertical centring cannot be
decided until every sibling's size is known.

- **Containers**: `stack` (vertical / horizontal), `grid`, `absolute`,
  `overlay`, `spacer`.
- **Sizes**: a number in canvas units, `"50%"`, `"auto"`, or `"fill"`.
- **Flex**: in a horizontal stack it shares width (which changes measurement);
  in a vertical stack it absorbs leftover height (which does not).
- **A `frame` is a box, not a suggestion.** Inside an `absolute` parent,
  `frame.height` fixes the node's height — which is how the Cinematic template
  bottom-anchors its whole lower block above the credit line.

---

## 8. Versioning, and the promise it keeps

A card stores `template_id` **and** `template_version`. Publishing v3 does not
touch a card pinned to v2 — a link someone shared last month keeps showing what
they shared. `cards.profile_snapshot` makes the same promise about data.

Both are opt-in to change:

- **Refresh** (`POST /api/cards/:id/regenerate`) re-reads the profile.
- **Update** (`POST /api/cards/:id/upgrade`) moves to the newest version.

The seeder enforces this too: editing `cardTemplates.ts` and restarting creates
a **new version** rather than rewriting the current one.

---

## 9. Capabilities — how much freedom a template gives

Each template declares what a user may change, and each node may narrow it
further:

```json
{
  "capabilities": { "accentColor": true, "reposition": false, "maxCustomElements": 4 },
  "editable": { "content": true, "image": true, "position": false }
}
```

The editor hides controls a template disallows. That is convenience.
`applyCapabilityBoundaries()` in `cardService.ts` filters the payload again on
the way into the database — **that** is the enforcement, because the editor is
not the only thing that can send a `PATCH`.

---

## 10. Security

- Template definitions are **documents**. There is no code path that executes
  anything a template carries.
- `templateDefinitionSchema` allowlists every component type, bounds every
  dimension, caps text length, and refuses trees deeper than 12 or larger than
  240 nodes.
- Colours are hex values or token names. Not `url(...)`, not CSS functions.
- Fonts are a closed set of four system stacks — which also guarantees the
  export rasterises with the same metrics the preview measured.
- Customisation from a browser is never trusted; see §9.

---

## 11. Adding a template

Two ways, and they produce identical rows:

**From the admin panel** — `/admin/cards` → New template. The definition is
edited as JSON next to a live proof rendered with a specimen profile. Save as a
draft or publish; publishing points `current_version` at the new version.

**In code** — add an entry to `SEED_TEMPLATES` in
`backend/src/services/cardTemplates.ts`. On boot, `ensureCatalogSeeded()`
validates it, and publishes a new version if the definition changed. Seeded
rows carry `is_seed = TRUE`; anything created in the admin panel is never
touched by the seeder.

### Judging a template before shipping it

Templates are laid out by the engine, so the way to check one is to look at it.
Render the catalogue to SVG with `renderToStaticMarkup(<CardRenderer …/>)` and
rasterise the result with `sharp` — the layout is identical to the browser's
because positions are computed, not styled. Three of the shipped templates were
overflowing their canvas until exactly this caught them.

---

## 12. What was replaced

`share_cards` held two hard-coded looks (`occasion` and `profile`). Both survive
as templates — `occasion_01` is the terracotta locket card, unchanged — and
`importLegacyShareCards()` copies every existing row into `cards` on boot,
idempotently through `cards.legacy_share_card_id`. The old table is left in
place; nothing anyone made was lost.
