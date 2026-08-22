/**
 * The card engine's vocabulary.
 *
 * These types mirror `backend/src/schema/cardSchema.ts`, which is the
 * authority: the backend decides what may be *stored*, this file describes what
 * the renderer may *receive*. Anything arriving that does not fit is skipped
 * rather than thrown, because a catalogue written by a newer backend must not
 * blank out a user's card.
 */

export type FontKey = 'serif' | 'sans' | 'mono' | 'display'

export type ColorRef = string

export interface Gradient {
  type: 'linear' | 'radial'
  angle?: number
  stops: { offset: number; color: ColorRef; opacity?: number }[]
}

export type Fill = ColorRef | Gradient

export type Size = number | string
export type Coord = number | string
export type Edge = number | { top?: number; right?: number; bottom?: number; left?: number }

export interface TextStyleDef {
  family?: FontKey
  size?: number
  weight?: number
  italic?: boolean
  letterSpacing?: number
  lineHeight?: number
  transform?: 'none' | 'upper' | 'lower' | 'title'
  color?: ColorRef
  opacity?: number
  align?: 'left' | 'center' | 'right'
}

export type ImageTreatment =
  | 'none'
  | 'grayscale'
  | 'sepia'
  | 'warm'
  | 'cool'
  | 'contrast'
  | 'fade'

export interface StyleTokens {
  colors: Record<string, string> & {
    background: string
    surface: string
    surfaceAlt: string
    ink: string
    inkSoft: string
    accent: string
    accentInk: string
    border: string
    highlight: string
  }
  fonts: { heading: FontKey; body: FontKey; mono: FontKey }
  radius: { card: number; image: number; pill: number }
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number }
  effects: {
    grain?: number
    vignette?: number
    imageTreatment?: ImageTreatment
    borderWidth?: number
    rule?: number
  }
  textStyles: Record<string, TextStyleDef>
}

export interface CardStyle {
  id: string
  name: string
  description?: string | null
  tokens: StyleTokens
}

export interface NodeEditable {
  content?: boolean
  image?: boolean
  position?: boolean
  size?: boolean
  visibility?: boolean
  color?: boolean
}

export interface BaseNode {
  id?: string
  type: string
  when?: string
  hidden?: boolean
  width?: Size
  height?: Size
  minHeight?: number
  maxHeight?: number
  flex?: number
  margin?: Edge
  padding?: Edge
  align?: 'start' | 'center' | 'end' | 'stretch'
  frame?: { x: Coord; y: Coord; width?: Size; height?: Size }
  rotate?: number
  opacity?: number
  background?: Fill
  radius?: number
  border?: {
    width: number
    color: ColorRef
    dashed?: boolean
    sides?: ('top' | 'right' | 'bottom' | 'left')[]
  }
  shadow?: boolean
  editable?: NodeEditable
  label?: string
  children?: CardNode[]
  /** Component props. Validated per type by the registry, never executed. */
  props?: Record<string, unknown>
  /* stack */
  direction?: 'vertical' | 'horizontal'
  gap?: number | string
  justify?: 'start' | 'center' | 'end' | 'between'
  items?: 'start' | 'center' | 'end' | 'stretch'
  wrap?: boolean
  /* grid */
  columns?: number
  rowGap?: number | string
  /* spacer */
  size?: number | 'flex'
}

export type CardNode = BaseNode

export interface Capabilities {
  accentColor: boolean
  backgroundColor: boolean
  inkColor: boolean
  fontChange: boolean
  styleSwap: boolean
  customText: boolean
  photoReplacement: boolean
  reposition: boolean
  resize: boolean
  sectionVisibility: boolean
  decorations: boolean
  imageTreatment: boolean
  maxCustomElements: number
}

export interface TemplateDefinition {
  canvas: { width: number; height: number; background?: Fill; padding?: Edge }
  textStyles?: Record<string, TextStyleDef>
  tokens?: { colors?: Record<string, string>; effects?: StyleTokens['effects'] }
  root: CardNode
  capabilities: Capabilities
  supportedFields?: string[]
}

export interface CardTemplate {
  id: string
  name: string
  description?: string | null
  category?: string
  thumbnailUrl?: string | null
  version: number
  definition: TemplateDefinition
  defaultStyleId?: string | null
  allowedStyleIds?: string[]
  isPremium?: boolean
}

export interface CustomElement {
  id: string
  type: 'text' | 'sticker' | 'badge' | 'divider' | 'shape' | 'image'
  value: string
  /** Fractions of the canvas, so an element keeps its place at any export size. */
  x: number
  y: number
  scale: number
  rotate: number
  color?: ColorRef
  styleRole?: string
}

export interface CardCustomization {
  styleId?: string
  colors: Record<string, string>
  fonts: { heading?: FontKey; body?: FontKey }
  content: Record<string, string | string[]>
  images: Record<
    string,
    { url: string; offsetX: number; offsetY: number; scale: number; treatment?: ImageTreatment }
  >
  visibility: Record<string, boolean>
  transforms: Record<string, { dx: number; dy: number; scale: number; rotate: number }>
  elements: CustomElement[]
  effects: { grain?: boolean; vignette?: boolean; imageTreatment?: ImageTreatment }
}

export const EMPTY_CUSTOMIZATION: CardCustomization = {
  colors: {},
  fonts: {},
  content: {},
  images: {},
  visibility: {},
  transforms: {},
  elements: [],
  effects: {},
}

/** Fills in whatever an older or partial payload left out. */
export function normalizeCustomization(input?: Partial<CardCustomization> | null): CardCustomization {
  return {
    styleId: input?.styleId,
    colors: input?.colors ?? {},
    fonts: input?.fonts ?? {},
    content: input?.content ?? {},
    images: input?.images ?? {},
    visibility: input?.visibility ?? {},
    transforms: input?.transforms ?? {},
    elements: input?.elements ?? [],
    effects: input?.effects ?? {},
  }
}

export interface CardProfileData {
  name: string
  username: string
  tagline: string
  occupation: string
  education: string
  location: string
  age?: number | ''
  bio: string
  quote: string
  quoteAuthor: string
  currentChapter: string
  nextChapter: string
  interests: string[]
  traits: string[]
  favourites: { label: string; value: string }[]
  stats: { label: string; value: string }[]
  meters: { label: string; value: number }[]
  achievements: { title: string; note?: string; year?: string }[]
  timeline: { year: string; title: string; note?: string }[]
  goals: string[]
  photos: { id?: string; url: string; caption?: string }[]
  socials: { platform: string; handle: string; url?: string }[]
}

export const EMPTY_PROFILE: CardProfileData = {
  name: '',
  username: '',
  tagline: '',
  occupation: '',
  education: '',
  location: '',
  bio: '',
  quote: '',
  quoteAuthor: '',
  currentChapter: '',
  nextChapter: '',
  interests: [],
  traits: [],
  favourites: [],
  stats: [],
  meters: [],
  achievements: [],
  timeline: [],
  goals: [],
  photos: [],
  socials: [],
}

export function normalizeProfile(input?: Partial<CardProfileData> | null): CardProfileData {
  return { ...EMPTY_PROFILE, ...(input ?? {}) }
}

export interface Card {
  id: string
  title: string
  templateId: string
  templateVersion: number
  styleId: string | null
  customization: Partial<CardCustomization>
  profileSnapshot: Partial<CardProfileData>
  shareSlug: string | null
  isPublic: boolean
  isPrimary: boolean
  createdAt: string
  updatedAt: string
}

/** What `/api/cards` returns: the cards, plus everything needed to draw them. */
export interface CardBundle {
  cards: Card[]
  templates: Record<string, { id: string; name: string; version: number; definition: TemplateDefinition }>
  styles: Record<string, CardStyle>
}

export interface Catalog {
  templates: CardTemplate[]
  styles: CardStyle[]
  categories: string[]
}

/* ── Geometry ─────────────────────────────────────────────────────────────── */

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** One node after data binding, style resolution and layout. */
export interface PlacedNode {
  node: CardNode
  rect: Rect
  /** Resolved props with every binding already substituted. */
  props: Record<string, unknown>
  children: PlacedNode[]
}

/** The output of an export preset. */
export interface ExportPreset {
  id: string
  label: string
  width: number
  height: number
  note: string
}

export const EXPORT_PRESETS: ExportPreset[] = [
  { id: 'portrait', label: 'Instagram post', width: 1080, height: 1350, note: '4:5' },
  { id: 'square', label: 'Square', width: 1080, height: 1080, note: '1:1' },
  { id: 'story', label: 'Story & status', width: 1080, height: 1920, note: '9:16' },
  { id: 'linkedin', label: 'LinkedIn', width: 1200, height: 1200, note: '1:1' },
  { id: 'hi_res', label: 'High resolution', width: 2160, height: 2700, note: '2× 4:5' },
]
