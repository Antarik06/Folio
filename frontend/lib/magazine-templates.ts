import { AlbumSpread } from '@/components/album-editor/types'
import {
  buildSpreads,
  captioned,
  chapter,
  cover,
  duo,
  fullBleed,
  matted,
  quad,
  triptych,
  type PageLayout,
  type PaletteSpec,
} from '@/lib/album-layouts'

/**
 * The style catalogue: five styles, two or three templates each.
 *
 * It used to list eight templates, but only three were ever authored — the
 * other five were `cloneTemplateSpreads` of those three under different names,
 * so "Eternal Romance" was literally the Vintage travel layout with the title
 * swapped. A ninth, ADVENTURE_TEMPLATE, was exported and imported by nothing.
 *
 * Every template here is composed from real page layouts, so two templates in
 * the same style differ because their geometry differs — a wide mat versus a
 * full bleed, a 2×2 grid versus a triptych — not because of their name.
 *
 * Photo slots ship empty (`src: ''`). They fill with the user's own photographs
 * when the template is applied, and the gallery previews the *layout* rather
 * than a stock photograph standing in for one.
 */

export interface MagazineTemplate {
  id: string
  name: string
  description: string
  thumbnail: string
  category: string
  productType?: 'magazine' | 'photo_book'
  spreads: AlbumSpread[]
  layout_schema?: any
  isDynamic?: boolean
  pageCount?: number
}

export interface AlbumStyle {
  id: string
  /** The label used everywhere: nav, gallery, editor. */
  name: string
  /** One line. What this style is for. */
  line: string
  /** Drives the card's print idiom in the gallery. */
  idiom: 'letterpress' | 'stamp' | 'plate' | 'contact-strip' | 'ledger'
  palette: PaletteSpec
}

/* ── The five ─────────────────────────────────────────────────────────────── */

const IVORY: PaletteSpec = { paper: '#FDFAF5', ink: '#1C1814', accent: '#B85C38', dark: '#1C1814' }
const LINEN: PaletteSpec = { paper: '#F5F0E8', ink: '#1C1814', accent: '#3A7D6E', dark: '#242019' }
const CHALK: PaletteSpec = { paper: '#FFFFFF', ink: '#151515', accent: '#7A6F64', dark: '#101010' }
const WARM: PaletteSpec = { paper: '#F7F1E7', ink: '#2B2118', accent: '#B85C38', dark: '#2B2118' }
const SLATE: PaletteSpec = { paper: '#F2F2F0', ink: '#141414', accent: '#B85C38', dark: '#0E0E0E' }

export const ALBUM_STYLES: AlbumStyle[] = [
  {
    id: 'wedding',
    name: 'Wedding',
    line: 'Engraved serif on a wide ivory mat. Made to be handed round a room.',
    idiom: 'letterpress',
    palette: IVORY,
  },
  {
    id: 'travel',
    name: 'Travel',
    line: 'Passport type and full-bleed landscapes, stamped with where you were.',
    idiom: 'stamp',
    palette: LINEN,
  },
  {
    id: 'portrait',
    name: 'Portrait',
    line: 'People at the centre, generous margins, nothing crowding the face.',
    idiom: 'plate',
    palette: WARM,
  },
  {
    id: 'editorial',
    name: 'Editorial',
    line: 'High contrast and asymmetric grids, the way a magazine sets a shoot.',
    idiom: 'contact-strip',
    palette: CHALK,
  },
  {
    id: 'year',
    name: 'The Year',
    line: 'A dense chronological record — twelve months, dated and in order.',
    idiom: 'ledger',
    palette: SLATE,
  },
]

/* ── Templates ────────────────────────────────────────────────────────────── */

interface Spec {
  id: string
  name: string
  style: string
  description: string
  pages: PageLayout[]
}

const SPECS: Spec[] = [
  /* ── Wedding ─────────────────────────────────────────────────────────── */
  {
    id: 'wedding-vows',
    name: 'The Vows',
    style: 'wedding',
    description:
      'Wide ivory mats and one photograph to a page. The quietest album in the catalogue — nothing competes with the picture.',
    pages: [
      cover('The Vows', 'Folio · Wedding'),
      matted(110),
      matted(110),
      captioned('The ceremony', 'Everything from the hour it took.'),
      duo,
      matted(110),
    ],
  },
  {
    id: 'wedding-celebration',
    name: 'The Celebration',
    style: 'wedding',
    description:
      'Denser and louder — full bleeds against 2×2 grids, for the parts of the day nobody stood still for.',
    pages: [
      cover('The Celebration', 'Folio · Wedding'),
      fullBleed,
      quad,
      triptych,
      fullBleed,
      quad,
    ],
  },
  {
    id: 'wedding-two-families',
    name: 'Two Families',
    style: 'wedding',
    description:
      'Built around chapter breaks — one for each side, each opening on type before a single portrait.',
    pages: [
      cover('Two Families', 'Folio · Wedding'),
      chapter('One', 'Her side'),
      matted(100),
      duo,
      chapter('Two', 'His side'),
      matted(100),
      duo,
    ],
  },

  /* ── Travel ──────────────────────────────────────────────────────────── */
  {
    id: 'travel-minimalist',
    name: 'The Minimalist Traveler',
    style: 'travel',
    description:
      'Spacious and slow. One impactful frame at a time, with room to breathe between them.',
    pages: [
      cover('The Escape', 'Folio · Travel'),
      matted(90),
      captioned('Beyond the horizon', 'Where the road ran out.'),
      matted(90),
      duo,
    ],
  },
  {
    id: 'travel-expedition',
    name: 'Expedition',
    style: 'travel',
    description:
      'Full-bleed landscapes back to back, broken by a triptych. For places that need the whole page.',
    pages: [
      cover('Expedition', 'Folio · Travel'),
      fullBleed,
      triptych,
      fullBleed,
      captioned('Camp two', 'Four thousand metres, and still climbing.'),
      fullBleed,
    ],
  },
  {
    id: 'travel-wanderlust',
    name: 'Wanderlust',
    style: 'travel',
    description:
      'Warm stock and mixed density — grids of small frames against the occasional full page.',
    pages: [
      cover('Wanderlust', 'Folio · Travel'),
      quad,
      matted(80),
      quad,
      fullBleed,
      duo,
    ],
  },

  /* ── Portrait ────────────────────────────────────────────────────────── */
  {
    id: 'portrait-tender',
    name: 'Tender',
    style: 'portrait',
    description:
      'Small photographs, very wide margins. Built for faces, and for albums people hold close.',
    pages: [
      cover('Tender', 'Folio · Portrait'),
      matted(130),
      matted(130),
      captioned('First year', 'Month by month, and all at once.'),
      duo,
    ],
  },
  {
    id: 'portrait-milestone',
    name: 'Milestone',
    style: 'portrait',
    description:
      'Chapter breaks between grids — one opening per occasion, then everything from it.',
    pages: [
      cover('Milestone', 'Folio · Portrait'),
      chapter('One', 'The day itself'),
      quad,
      triptych,
      chapter('Two', 'Everyone who came'),
      quad,
    ],
  },

  /* ── Editorial ───────────────────────────────────────────────────────── */
  {
    id: 'editorial-noir',
    name: 'Noir',
    style: 'editorial',
    description:
      'High contrast, asymmetric, unapologetic. Full bleeds against tight triptychs on white.',
    pages: [
      cover('Noir', 'Folio · Editorial'),
      fullBleed,
      triptych,
      fullBleed,
      triptych,
      captioned('The shoot', 'Two rolls, one afternoon.'),
    ],
  },
  {
    id: 'editorial-gallery',
    name: 'Gallery',
    style: 'editorial',
    description:
      'A hung wall on paper. Everything matted identically so the work sets its own rhythm.',
    pages: [
      cover('Gallery', 'Folio · Editorial'),
      matted(100),
      matted(100),
      matted(100),
      duo,
      matted(100),
    ],
  },

  /* ── The Year ────────────────────────────────────────────────────────── */
  {
    id: 'year-almanac',
    name: 'Almanac',
    style: 'year',
    description:
      'Dense and dated. Grids throughout, so a whole year fits without anything being cut.',
    pages: [
      cover('The Year', 'Folio · Almanac'),
      quad,
      quad,
      triptych,
      quad,
      quad,
    ],
  },
  {
    id: 'year-ledger',
    name: 'Ledger',
    style: 'year',
    description:
      'Chapter break, then the month. Twelve openings, in order, like entries in a book.',
    pages: [
      cover('Ledger', 'Folio · Almanac'),
      chapter('01', 'Winter'),
      quad,
      chapter('02', 'Spring'),
      quad,
      chapter('03', 'Summer'),
      triptych,
    ],
  },
]

function styleFor(id: string): AlbumStyle {
  return ALBUM_STYLES.find((s) => s.id === id) ?? ALBUM_STYLES[0]
}

export const ALL_MAGAZINE_TEMPLATES: MagazineTemplate[] = SPECS.map((spec) => {
  const style = styleFor(spec.style)
  return {
    id: spec.id,
    name: spec.name,
    description: spec.description,
    // No stock photograph stands in for the user's work; the gallery draws the
    // template's own geometry instead.
    thumbnail: '',
    category: style.name,
    productType: 'magazine' as const,
    spreads: buildSpreads(spec.id, style.palette, spec.pages),
    pageCount: spec.pages.length,
  }
})

/** Templates grouped under the style they belong to, in catalogue order. */
export const TEMPLATES_BY_STYLE: { style: AlbumStyle; templates: MagazineTemplate[] }[] =
  ALBUM_STYLES.map((style) => ({
    style,
    templates: ALL_MAGAZINE_TEMPLATES.filter(
      (t) => SPECS.find((s) => s.id === t.id)?.style === style.id
    ),
  }))

/** The style a template belongs to. */
export function styleOfTemplate(templateId: string): AlbumStyle | undefined {
  const spec = SPECS.find((s) => s.id === templateId)
  return spec ? styleFor(spec.style) : undefined
}
