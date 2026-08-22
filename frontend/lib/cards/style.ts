import type {
  CardCustomization,
  ColorRef,
  Fill,
  FontKey,
  Gradient,
  ImageTreatment,
  StyleTokens,
  TemplateDefinition,
  TextStyleDef,
} from './types'

/**
 * The style resolver.
 *
 * Four layers, merged in this order, each one narrower than the last:
 *
 *     base style  →  template overrides  →  user customisation  →  node props
 *
 * Templates never name a colour or a size directly if they can name a token, so
 * a card restyles completely when the layer underneath changes. Anything a
 * template *does* hard-code (a white headline over a photograph, say) survives
 * a style swap on purpose.
 */

/**
 * The four families a card may use. Deliberately system stacks: the exported
 * PNG is rasterised by the browser from the same SVG the preview shows, and a
 * webfont that had not finished loading would rasterise as a fallback and make
 * the export differ from the preview.
 */
export const FONT_STACKS: Record<FontKey, string> = {
  serif: "Georgia, 'Times New Roman', Times, serif",
  sans: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
  display: "'Times New Roman', Times, Georgia, serif",
}

export interface ResolvedTextStyle {
  family: FontKey
  fontFamily: string
  size: number
  weight: number
  italic: boolean
  letterSpacing: number
  lineHeight: number
  transform: 'none' | 'upper' | 'lower' | 'title'
  color: string
  opacity: number
  align: 'left' | 'center' | 'right'
}

export interface ResolvedStyle {
  tokens: StyleTokens
  colors: Record<string, string>
  /** Resolves `accent`, `colors.accent` or `#B85C38` to a paintable colour. */
  color(ref: ColorRef | undefined, fallback?: string): string
  /** Resolves a spacing token name or a raw number. */
  space(value: number | string | undefined, fallback?: number): number
  radius(value: number | string | undefined, fallback?: number): number
  /** A named type role plus optional inline overrides from a node's props. */
  text(role: string | undefined, overrides?: TextStyleDef): ResolvedTextStyle
  imageTreatment: ImageTreatment
  grain: number
  vignette: number
}

const FALLBACK_TOKENS: StyleTokens = {
  colors: {
    background: '#F5F0E8',
    surface: '#FDFAF5',
    surfaceAlt: '#EBE4D8',
    ink: '#1C1814',
    inkSoft: '#736859',
    accent: '#B85C38',
    accentInk: '#FDFAF5',
    border: '#D8D1C4',
    highlight: '#3A7D6E',
  },
  fonts: { heading: 'serif', body: 'sans', mono: 'mono' },
  radius: { card: 0, image: 0, pill: 999 },
  spacing: { xs: 10, sm: 18, md: 30, lg: 52, xl: 84 },
  effects: {},
  textStyles: {},
}

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

function isGradient(fill: Fill | undefined): fill is Gradient {
  return !!fill && typeof fill === 'object' && Array.isArray((fill as Gradient).stops)
}

export { isGradient }

export function resolveStyle(
  baseTokens: StyleTokens | undefined,
  definition: TemplateDefinition,
  customization: Partial<CardCustomization> = {}
): ResolvedStyle {
  const base: StyleTokens = {
    ...FALLBACK_TOKENS,
    ...(baseTokens ?? {}),
    colors: { ...FALLBACK_TOKENS.colors, ...(baseTokens?.colors ?? {}) },
    fonts: { ...FALLBACK_TOKENS.fonts, ...(baseTokens?.fonts ?? {}) },
    radius: { ...FALLBACK_TOKENS.radius, ...(baseTokens?.radius ?? {}) },
    spacing: { ...FALLBACK_TOKENS.spacing, ...(baseTokens?.spacing ?? {}) },
    effects: { ...FALLBACK_TOKENS.effects, ...(baseTokens?.effects ?? {}) },
    textStyles: { ...FALLBACK_TOKENS.textStyles, ...(baseTokens?.textStyles ?? {}) },
  }

  const colors: Record<string, string> = {
    ...base.colors,
    ...(definition.tokens?.colors ?? {}),
    ...(customization.colors ?? {}),
  }

  const effects = {
    ...base.effects,
    ...(definition.tokens?.effects ?? {}),
  }

  const color = (ref: ColorRef | undefined, fallback = colors.ink): string => {
    if (!ref) return fallback
    if (ref === 'none' || ref === 'transparent') return 'transparent'
    if (HEX.test(ref)) return ref
    const key = ref.startsWith('colors.') ? ref.slice('colors.'.length) : ref
    return colors[key] ?? fallback
  }

  const space = (value: number | string | undefined, fallback = 0): number => {
    if (typeof value === 'number') return value
    if (!value) return fallback
    const key = value.startsWith('spacing.') ? value.slice('spacing.'.length) : value
    const token = (base.spacing as Record<string, number>)[key]
    return typeof token === 'number' ? token : fallback
  }

  const radius = (value: number | string | undefined, fallback = 0): number => {
    if (typeof value === 'number') return value
    if (!value) return fallback
    const key = value.startsWith('radius.') ? value.slice('radius.'.length) : value
    const token = (base.radius as Record<string, number>)[key]
    return typeof token === 'number' ? token : fallback
  }

  /**
   * A font swap is expressed as a role change, not as a per-style edit: picking
   * a new heading font replaces whichever family the style used for headings,
   * everywhere it was used, and leaves the body alone.
   */
  const swapFamily = (family: FontKey): FontKey => {
    const fonts = customization.fonts ?? {}
    if (fonts.heading && family === base.fonts.heading) return fonts.heading
    if (fonts.body && family === base.fonts.body) return fonts.body
    return family
  }

  const text = (role: string | undefined, overrides: TextStyleDef = {}): ResolvedTextStyle => {
    const fromStyle = (role && base.textStyles[role]) || {}
    const fromTemplate = (role && definition.textStyles?.[role]) || {}
    const merged: TextStyleDef = { ...fromStyle, ...fromTemplate, ...overrides }

    const family = swapFamily(merged.family ?? base.fonts.body)

    return {
      family,
      fontFamily: FONT_STACKS[family] ?? FONT_STACKS.sans,
      size: merged.size ?? 28,
      weight: merged.weight ?? 400,
      italic: merged.italic ?? false,
      letterSpacing: merged.letterSpacing ?? 0,
      lineHeight: merged.lineHeight ?? 1.4,
      transform: merged.transform ?? 'none',
      color: color(merged.color, colors.ink),
      opacity: merged.opacity ?? 1,
      align: merged.align ?? 'left',
    }
  }

  return {
    tokens: base,
    colors,
    color,
    space,
    radius,
    text,
    imageTreatment:
      customization.effects?.imageTreatment ?? effects.imageTreatment ?? 'none',
    grain: customization.effects?.grain === false ? 0 : effects.grain ?? 0,
    vignette: customization.effects?.vignette === false ? 0 : effects.vignette ?? 0,
  }
}

/** Applies a text style's case transform. Layout measures the result, not the source. */
export function applyTransform(value: string, transform: ResolvedTextStyle['transform']): string {
  switch (transform) {
    case 'upper':
      return value.toUpperCase()
    case 'lower':
      return value.toLowerCase()
    case 'title':
      return value.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    default:
      return value
  }
}

/**
 * The SVG filter that carries a treatment. Returned as a filter id the renderer
 * has already defined in <defs>, so a treatment costs one attribute.
 */
export const TREATMENT_FILTERS: Record<ImageTreatment, string | null> = {
  none: null,
  grayscale: 'cardGrayscale',
  sepia: 'cardSepia',
  warm: 'cardWarm',
  cool: 'cardCool',
  contrast: 'cardContrast',
  fade: 'cardFade',
}
