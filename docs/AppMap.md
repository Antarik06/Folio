# AppMap.md — Final Names, Structure & Rename Spec

> This is a build spec, not a strategy memo — hand it directly to a coding agent along with AppStructure.md and Cleanup.md. It defines the final simple names for every tab, feature, route, and component in the app, and an explicit old-name → new-name map so the rename is mechanical rather than interpretive.

---

## 1. The three tabs (final names)

| Tab | Contains | One-line job |
|---|---|---|
| **Photos** | Library, Events | Where every photo lives |
| **Create** | Styles, Editor, Ask an Artist, Orders | Turn photos into an album, print, or card |
| **Profile** | My Page, Cards | Your public page and what you share outside the app |

Plus two role-gated areas that sit outside the three tabs, since they're a different persona, not a stage of the guest/host journey: **Artist Studio** (photographers) and **Admin** (staff).

### Inside Photos
- **Library** — every photo you have. Private by default.
- **Events** — a space you create to collect photos around an occasion, trip, or person. Can be shared with other people, or kept just for you. (Same underlying thing as before, broadened: an "Event" is now any space, not only a hosted multi-guest occasion.)

### Inside Create
- **Styles** — browse looks (Wedding, Travel, Polaroid, Adventure, etc.) and pick photos to use.
- **Editor** — the canvas tool to build it yourself.
- **Ask an Artist** — request a real photographer/designer to build it for you.
- **Orders** — track prints and deliveries.

### Inside Profile
- **My Page** — your public profile.
- **Cards** — the shareable, occasion-based designed cards.

---

## 2. Rename map — user-facing labels

| Old label (in the app today) | New label | Why |
|---|---|---|
| Overview | *(drop — Photos tab is the new home screen)* | one less concept |
| Popular Albums | Styles | plain description of what it is |
| Polaroid *(top-level nav item)* | Polaroid *(a style inside Create, not its own tab)* | same word, no longer a destination |
| Concierge | Ask an Artist | "Concierge" is hotel jargon; this says exactly what it does |
| Premium / Premium Concierge / Premium Dashboard | Ask an Artist | one name for one thing, not three |
| Adventure *(as a whole separate flow)* | Adventure *(a style inside Create, same as any other template)* | stop treating one template as a special app section |
| Artist Dashboard | Artist Studio | already fine, keep |
| Events *(as its own disconnected top-level idea)* | Events *(a section inside Photos)* | same word, now it has a proper home next to Library |
| "Photos of Me" | "Photos of Me" | already simple, keep as-is inside an Event |

---

## 3. Route rename map

```
OLD                                          NEW
/dashboard                                   /photos                (Photos tab, defaults to Library)
/dashboard/events                            /photos/events
/dashboard/events/new                        /photos/events/new
/dashboard/events/[id]                       /photos/events/[id]
/dashboard/events/[id]/my-photos             /photos/events/[id]/me
/dashboard/events/[id]/settings              /photos/events/[id]/settings
(new)                                         /photos/library         (personal photos, no event attached)

/dashboard/templates                         /create                 (Create tab, style picker)
/dashboard/templates/use/[id]                /create/[styleId]
/dashboard/templates/adventure               DELETE — orphaned, confirm then remove (see Cleanup.md)
/dashboard/templates/builder/[id]            /create/builder/[id]    (confirm this is distinct from editor before keeping)
/dashboard/templates/editor/[id]             fold into /editor/[albumId] if it's the same tool — confirm, don't keep two editors
/dashboard/templates/preview/[id]            /create/[styleId]/preview
/dashboard/premium                           /create/[styleId]/artist   (Ask an Artist becomes a branch of Create, not its own page)
/dashboard/polaroid                          DELETE — Polaroid becomes a style value inside /create, not a route
/editor/[id]                                 /create/editor/[albumId]
/dashboard/orders                            /create/orders
/dashboard/orders/checkout                   /create/orders/checkout
/dashboard/albums/[id]/order                 /create/orders/[albumId]

/preview/[id]                                /photos/events/[id]/preview   OR   keep one generic /preview/[id] used by everything (pick one, don't keep three)
/preview/polaroid                            DELETE — folds into the generic preview above
/preview/template/[albumId]                  DELETE — folds into the generic preview above

/dashboard/artist                            /artist-studio
/dashboard/admin                             /admin
/join/[code]                                 /join/[code]            (unchanged — entry point outside the tab bar, already simple)
```

---

## 4. Component rename / consolidation map

The three parallel 3D preview systems (`Book3D`, `Magazine3D`, `Polaroid3D` + their matching `*Experience` and `*PreviewUI` files) become **one** component pair, taking a `style` prop instead of being copy-pasted per style. This is the single highest-value consolidation for an LLM to execute, because it turns "find and edit the right one of nine files" into "edit one file":

```
OLD (9 files)                          NEW (2 files)
Book3D.tsx                             components/viewer/AlbumViewer.tsx
Magazine3D.tsx                              (takes: style: "book" | "magazine" | "polaroid")
Polaroid3D.tsx
Experience.tsx
MagazineExperience.tsx
PolaroidExperience.tsx
PreviewUI.tsx                          components/viewer/AlbumViewerControls.tsx
MagazinePreviewUI.tsx
PolaroidPreviewUI.tsx
```

Everything else:

```
OLD                                                        NEW
components/polaroid/polaroid-studio.tsx                    components/create/styles/polaroid.tsx
components/templates/adventure-flow.tsx                    DELETE (confirm orphaned per Cleanup.md, then remove)
components/premium/premium-dashboard-client.tsx            components/create/ask-an-artist/dashboard.tsx
components/premium/premium-intake.tsx                      components/create/ask-an-artist/intake.tsx
components/premium/premium-workspace.tsx                   components/create/ask-an-artist/workspace.tsx
components/flipbook/FlipBook.tsx (react-pageflip)          DELETE if AlbumViewer (3D) is the system you keep — pick one page-turn system, not two
backend routes/premiumRoutes.ts (has logic inline)         keep route file, MOVE logic into new services/artistRequestService.ts
backend routes/artistRoutes.ts (has idmlParser call inline) keep route file, MOVE idml handling into services/templateImportService.ts (alongside the existing psd import logic)
```

---

## 5. Naming rules going forward

Give these to any LLM building on this repo, human or not:

1. One plain word or a plain two-word phrase per feature, in code and in UI copy. No internal jargon ("Concierge", "Adventure Flow") leaking into either.
2. **Label = route slug = top component name**, same word, different casing only. `Ask an Artist` → `/create/[styleId]/artist` → `AskAnArtist.tsx`. If a label and a filename don't obviously match, rename one of them before adding more code.
3. One component per concept, parameterized by a prop — never `XStyle3D` + `XStyleExperience` + `XStylePreviewUI` repeated per style. If a new style needs a different look, extend the `style` prop's options, don't fork the files.
4. Business logic lives in `services/`; a `routes/*.ts` file only wires an HTTP request to a service call and returns the result. If a route file is getting long, that logic belongs in a service, not in a bigger route file.
5. Before adding a new top-level feature, it must fit inside **Photos**, **Create**, or **Profile**. If it doesn't fit any of the three, that's a signal an existing umbrella needs renaming or splitting — not that a fourth umbrella is needed.

---

## 6. Suggested order for a coding agent

1. Do the route + component renames in §3–4 first, with no behavior changes — this is a mechanical refactor, easiest to verify (does the app still work the same, at the new URLs, with fewer files).
2. Then apply the nav relabeling in §2.
3. Then build the new pieces (personal Library without an event, the Profile/Cards feature) on top of the now-consolidated structure, per AppStructure.md's build order (Create → Photos → Profile).
