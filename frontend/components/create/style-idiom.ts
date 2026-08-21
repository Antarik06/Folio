/**
 * Style idioms.
 *
 * The design's rule for the Styles Gallery is "a catalog, not a grid": crop the
 * photo out of any card and you should still know which style it was. So a
 * style is not a shared card shell with a different image — it carries its own
 * print idiom, and that idiom is data, declared once here.
 *
 * Adding a style means adding an entry to this map, not forking a component.
 */

export type IdiomKind =
  | 'letterpress' // engraved serif on an ivory mat — Wedding
  | 'polaroid' // literal polaroid frame with a caption in the bottom margin
  | 'stamp' // passport-stamp mono type and a compass mark — Travel
  | 'contact-strip' // black ground, sprocket holes, grease-pencil annotation
  | 'plate' // the plain bordered plate everything else falls back to

export interface StyleIdiom {
  kind: IdiomKind
  /** The mono tag under the name. Reads as a spec line, not marketing. */
  tag: string
}

/**
 * Category → idiom. Categories come from lib/magazine-templates and from
 * artist-published albums, so unknown values must fall back cleanly.
 */
const BY_CATEGORY: Record<string, StyleIdiom> = {
  Wedding: { kind: 'letterpress', tag: 'Engraved · Serif · Ivory mat' },
  Travel: { kind: 'stamp', tag: 'Passport mono · Compass mark' },
  Nostalgic: { kind: 'polaroid', tag: 'Instant frame · Handwritten' },
  Modern: { kind: 'contact-strip', tag: 'Contact strip · Grease pencil' },
  Fashion: { kind: 'contact-strip', tag: 'Contact strip · Full bleed' },
  Luxury: { kind: 'letterpress', tag: 'Foil · Serif · Deep mat' },
  Portfolio: { kind: 'plate', tag: 'Plate · Wide margin' },
  Birthday: { kind: 'polaroid', tag: 'Instant frame · Warm stock' },
  Artist: { kind: 'plate', tag: 'Artist original · Made to order' },
}

/** Specific templates that deserve their own idiom regardless of category. */
const BY_ID: Record<string, StyleIdiom> = {
  'adventure-travel': { kind: 'contact-strip', tag: '✂ Crop — grease pencil' },
  'travel-vintage': { kind: 'polaroid', tag: 'Instant frame · Aged stock' },
}

export function idiomFor(template: { id: string; category?: string }): StyleIdiom {
  return (
    BY_ID[template.id] ??
    BY_CATEGORY[template.category ?? ''] ??
    { kind: 'plate', tag: 'Plate · Wide margin' }
  )
}

/**
 * The four styles that take the asymmetric feature grid, in slot order:
 * cover feature (spans two rows), then two singles, then a wide strip.
 *
 * Picked by id where the catalogue has one, falling back to the first template
 * of a matching idiom so the grid is never short a slot.
 */
export const FEATURE_SLOTS: {
  preferredId: string
  preferredCategory: string
  slot: 'cover' | 'single-a' | 'single-b' | 'wide'
}[] = [
  { preferredId: 'wedding-eternal', preferredCategory: 'Wedding', slot: 'cover' },
  { preferredId: 'travel-vintage', preferredCategory: 'Nostalgic', slot: 'single-a' },
  { preferredId: 'travel-minimalist', preferredCategory: 'Travel', slot: 'single-b' },
  { preferredId: 'adventure-travel', preferredCategory: 'Modern', slot: 'wide' },
]

export function pickFeatures<T extends { id: string; category?: string }>(
  templates: T[]
): { slot: 'cover' | 'single-a' | 'single-b' | 'wide'; template: T }[] {
  const used = new Set<string>()
  const picked: { slot: 'cover' | 'single-a' | 'single-b' | 'wide'; template: T }[] = []

  for (const { preferredId, preferredCategory, slot } of FEATURE_SLOTS) {
    const match =
      templates.find((t) => t.id === preferredId && !used.has(t.id)) ??
      templates.find((t) => t.category === preferredCategory && !used.has(t.id)) ??
      templates.find((t) => !used.has(t.id))

    if (match) {
      used.add(match.id)
      picked.push({ slot, template: match })
    }
  }

  return picked
}
