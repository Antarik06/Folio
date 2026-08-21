# AppStructure.md — Three Umbrellas, One Pipeline

> Companion to Differentiation.md and Cleanup.md. Written in response to a proposal to reorganize Folio into three umbrellas: (1) designing an album/photo yourself or via an artist, including polaroid and print, (2) events + photo sharing + private personal storage, and (3) a social profile/card layer for sharing on other platforms.

---

## 1. Short answer: yes, and it's the right fix

This isn't just a good idea, it's the fix for the exact problem Cleanup.md flagged. Right now Polaroid, the Adventure template flow, and Premium Concierge each exist as their own semi-disconnected branch — separate nav items, separate components, no shared plumbing. That's not three deliberate product decisions, it's three features that each got built in their own corner. Grouping them under one umbrella isn't just tidier — it removes the actual mechanism that produced the sprawl in the first place, because new work will have an obvious home instead of a reason to become a fourth island.

The one refinement I'd make: don't think of it as three separate app sections bolted together. Think of it as **one pipeline with three stages**, because that's what it already is functionally — a photo has to exist somewhere before it can be designed into something, and it has to be designed before there's anything worth sharing. Naming it as three *umbrellas* invites building three parallel mini-apps (which is how you got here); naming it as one pipeline with three *stages* invites building one connected flow. Same reorganization, but the second framing is what keeps it seamless as you build.

---

## 2. The pipeline: Library → Create → Share

**Stage 1 — Library.** Where every photo lives, whichever way it got there: uploaded to a hosted event, matched to you via face-search as a guest, or just imported for yourself with nobody else involved. This is Events + guest galleries + "Photos of Me" + the private-storage idea, all merged — not as one screen, but as one underlying model (see §4).

**Stage 2 — Create.** Where a photo or a set of photos becomes something: a designed album, a single styled print, a polaroid-style card — built by the user in the editor, or handed to an artist via Concierge. This merges the editor, the template gallery, Polaroid Studio, and Premium Concierge.

**Stage 3 — Share.** Where a finished piece — a card, a favorite photo, a whole album — gets a public home: a profile page, and a one-tap export styled for Instagram/WhatsApp/whatever, including the festival/occasion card generator.

Everything you described maps cleanly onto this — the reason it feels like "is this a good idea to put it all under one roof" is that it's genuinely one roof already; it's just not built that way yet.

---

## 3. What folds into each stage

**Library** (existing: event creation, guest join/face-match, "my photos"; new: a private/personal mode)
- Host-created events, QR/invite join, guest selfie enrollment, face-matched "Photos of Me" — all already built.
- Add: importing or uploading photos with *no* event attached — just yours. Same storage, same photo model, different visibility.
- The distinction guests actually feel isn't "event vs. storage," it's "shared with a group vs. just mine" — model it as a property of a photo/collection, not a separate feature (§4).

**Create** (existing: editor, template gallery, Polaroid Studio, Premium Concierge, print export/Razorpay; consolidate: pick a source, pick a path, pick a style)
- Every one of these already ends at the same kind of output — a designed piece, digital and/or printed. Give them one entry flow: select photos (from Library) → choose *self-design* or *request an artist* → choose a style (wedding magazine, travel/adventure, polaroid strip, single print, whatever templates exist) → get a digital album, a print order, or both.
- Polaroid stops being a separate top-level destination and becomes one more *style* inside this flow, the same way "Adventure" or "Wedding" is a style. That alone removes a whole nav item and a whole parallel codepath.
- Premium Concierge becomes the "request an artist" branch of this same flow rather than its own dashboard living somewhere else — same intake, same photo selection, different assignee.

**Share** (new)
- A public profile page per user, and a card generator that pulls from *finished* Create-stage output or favorited Library photos.
- Festival/occasion-triggered card templates (Diwali, New Year, a birthday, an anniversary) generated in the same "Editorial Darkroom" visual language as everything else, so a shared card is recognizably Folio's the moment someone sees it.
- One-tap export sized for Instagram Stories/WhatsApp, plus a shareable profile link.

---

## 4. What makes this seamless instead of "three apps under one roof"

Three concrete decisions determine whether this feels like one product or three glued together:

**One photo picker, everywhere.** Right now Polaroid, the editor, and Premium each almost certainly have their own way of selecting/uploading photos — that duplication is exactly how they drifted apart. Build one photo-selection component that reads from Library (event galleries, "photos of me," personal uploads) and reuse it in every Create-stage entry point, including Concierge intake.

**One visibility flag, not a separate private-storage feature.** Don't build "private storage" as a distinct thing living inside the Events umbrella — model every photo/album with a visibility field (*private* / *shared with event guests* / *public on my profile*) and let Library, Create, and Share all read and write that same field. A photo starts private by default, becomes event-shared if uploaded to an event, and only becomes public if the user explicitly promotes it to their profile in the Share stage. This is also your consent mechanism for the profile/card feature — nothing reaches a public card without an explicit visibility change, one photo at a time.

**Self-design and artist-request converge on the same object.** Whether a user builds an album themselves or a Concierge artist builds it for them, both should produce the same underlying "Album" record with the same schema, viewable in the same place, exportable the same way. Right now these look like they're two different systems (`album-editor` vs. `premium`); they should be two different *ways in* to one system.

---

## 5. What this does to the nav

Today: Overview, Events, Popular Albums, Polaroid, Concierge — five items, three of which are really the same stage of work wearing different names. A pipeline-shaped nav is closer to:

- **Library** — my events, my photos, "photos of me," personal uploads
- **Create** — start a new album/print/card, from your own photos or an artist's help (this is where the template gallery, editor, Polaroid styles, and Concierge all live as one flow)
- **Share** — my profile, my cards, what's public

Plus Artist Studio and Admin staying as their own role-gated areas, since they're genuinely different personas, not stages of the same guest/host journey.

---

## 6. Build order

Doing all three at once is how you'd end up with a fourth half-finished umbrella. The pragmatic order:

1. **Create first.** This is the least net-new work — Polaroid, templates, the editor, and Concierge already exist; the job is re-plumbing them onto one photo picker and one entry flow, and folding Polaroid in as a style rather than a destination. Highest leverage, lowest new-code risk, and it's also the direct fix for the biggest Cleanup.md finding.
2. **Library second.** Mostly exists (events, face-match, guest galleries); the new piece is the visibility flag and a personal-upload path with no event attached. Small, well-scoped addition.
3. **Share last.** This is the only genuinely new umbrella (the profile + card feature from before). Build it last on purpose — it needs real Library and Create output to have anything worth sharing, and by then the visibility model from step 2 gives it a built-in consent mechanism instead of needing one bolted on afterward.
