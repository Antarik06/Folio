import type { StyleTokens } from '../schema/cardSchema'

/**
 * The shipped base styles.
 *
 * A style is a complete visual vocabulary — palette, type roles, spacing,
 * film treatment — and nothing else. It knows no layout. That separation is
 * what lets one template render seven different ways, and what lets a new
 * style appear in every template at once.
 *
 * These rows are seeded with is_seed = TRUE and re-synced on boot, so editing
 * this file ships a palette change. Styles created in the admin panel carry
 * is_seed = FALSE and are never touched by the seeder.
 */

export interface SeedStyle {
  id: string
  name: string
  description: string
  sortOrder: number
  tokens: StyleTokens
}

/**
 * The type scale every style fills in. Sizes are canvas units on a 1080-wide
 * card, so `body: 28` is roughly a 10px read on a phone-sized preview and a
 * comfortable one on the exported image.
 *
 * A style overrides only what its voice actually changes — family, weight,
 * tracking, case — and inherits the rhythm from here.
 */
function typeScale(
  heading: 'serif' | 'sans' | 'mono' | 'display',
  body: 'serif' | 'sans' | 'mono' | 'display',
  mono: 'serif' | 'sans' | 'mono' | 'display',
  colors: { ink: string; inkSoft: string; accent: string },
  overrides: Partial<Record<string, Record<string, unknown>>> = {}
): StyleTokens['textStyles'] {
  const base: StyleTokens['textStyles'] = {
    display: {
      family: heading,
      size: 128,
      weight: 400,
      lineHeight: 0.92,
      letterSpacing: -2.5,
      color: colors.ink,
    },
    heroName: {
      family: heading,
      size: 86,
      weight: 400,
      lineHeight: 1,
      letterSpacing: -1.2,
      color: colors.ink,
    },
    title: {
      family: heading,
      size: 46,
      weight: 400,
      lineHeight: 1.12,
      letterSpacing: -0.4,
      color: colors.ink,
    },
    subtitle: {
      family: body,
      size: 31,
      weight: 400,
      lineHeight: 1.3,
      color: colors.inkSoft,
    },
    body: {
      family: body,
      size: 28,
      weight: 400,
      lineHeight: 1.55,
      color: colors.ink,
    },
    bodySmall: {
      family: body,
      size: 24,
      weight: 400,
      lineHeight: 1.5,
      color: colors.inkSoft,
    },
    label: {
      family: mono,
      size: 19,
      weight: 400,
      letterSpacing: 2.4,
      lineHeight: 1.4,
      transform: 'upper',
      color: colors.inkSoft,
    },
    labelStrong: {
      family: mono,
      size: 21,
      weight: 500,
      letterSpacing: 2.8,
      lineHeight: 1.4,
      transform: 'upper',
      color: colors.accent,
    },
    quote: {
      family: heading,
      size: 38,
      weight: 400,
      italic: true,
      lineHeight: 1.34,
      color: colors.ink,
    },
    caption: {
      family: body,
      size: 21,
      weight: 400,
      lineHeight: 1.4,
      color: colors.inkSoft,
    },
    stat: {
      family: heading,
      size: 62,
      weight: 400,
      lineHeight: 1,
      letterSpacing: -1,
      color: colors.ink,
    },
    statLabel: {
      family: mono,
      size: 17,
      weight: 400,
      letterSpacing: 2,
      transform: 'upper',
      lineHeight: 1.3,
      color: colors.inkSoft,
    },
    year: {
      family: mono,
      size: 24,
      weight: 500,
      letterSpacing: 1.2,
      lineHeight: 1.3,
      color: colors.accent,
    },
    tag: {
      family: body,
      size: 24,
      weight: 400,
      lineHeight: 1.25,
      color: colors.ink,
    },
    handle: {
      family: mono,
      size: 22,
      weight: 400,
      letterSpacing: 1.6,
      lineHeight: 1.3,
      color: colors.inkSoft,
    },
  }

  for (const [role, patch] of Object.entries(overrides)) {
    base[role] = { ...(base[role] ?? {}), ...(patch as Record<string, never>) }
  }
  return base
}

const spacing = { xs: 10, sm: 18, md: 30, lg: 52, xl: 84 }

export const SEED_STYLES: SeedStyle[] = [
  /* ── 01 Paper ─────────────────────────────────────────────────────────── */
  {
    id: 'paper',
    name: 'Paper',
    description: 'Folio house style. Aged paper, warm ink, terracotta accent, printers marks.',
    sortOrder: 10,
    tokens: {
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
      spacing,
      effects: { grain: 0.05, vignette: 0, imageTreatment: 'warm', borderWidth: 2, rule: 2 },
      textStyles: typeScale('serif', 'sans', 'mono', {
        ink: '#1C1814',
        inkSoft: '#736859',
        accent: '#B85C38',
      }),
    },
  },

  /* ── 02 Darkroom ──────────────────────────────────────────────────────── */
  {
    id: 'darkroom',
    name: 'Darkroom',
    description: 'Near-black ground, warm white type, one terracotta line. Cinematic and quiet.',
    sortOrder: 20,
    tokens: {
      colors: {
        background: '#14110E',
        surface: '#1E1A15',
        surfaceAlt: '#282219',
        ink: '#F2EBE0',
        inkSoft: '#A2988A',
        accent: '#C96A42',
        accentInk: '#14110E',
        border: '#3A332A',
        highlight: '#D9B166',
      },
      fonts: { heading: 'serif', body: 'sans', mono: 'mono' },
      radius: { card: 0, image: 2, pill: 999 },
      spacing,
      effects: { grain: 0.09, vignette: 0.35, imageTreatment: 'contrast', borderWidth: 1, rule: 1 },
      textStyles: typeScale(
        'serif',
        'sans',
        'mono',
        { ink: '#F2EBE0', inkSoft: '#A2988A', accent: '#C96A42' },
        { display: { letterSpacing: -3 }, heroName: { letterSpacing: -1.6 } }
      ),
    },
  },

  /* ── 03 Ivory ─────────────────────────────────────────────────────────── */
  {
    id: 'ivory',
    name: 'Ivory',
    description: 'The quiet one. Bright white, near-black type, stone accent, a great deal of air.',
    sortOrder: 30,
    tokens: {
      colors: {
        background: '#FFFFFF',
        surface: '#FAF9F7',
        surfaceAlt: '#F1EFEA',
        ink: '#141414',
        inkSoft: '#8A8378',
        accent: '#8A7C6D',
        accentInk: '#FFFFFF',
        border: '#E4E1DA',
        highlight: '#141414',
      },
      fonts: { heading: 'sans', body: 'sans', mono: 'mono' },
      radius: { card: 0, image: 4, pill: 999 },
      spacing: { xs: 12, sm: 20, md: 34, lg: 60, xl: 96 },
      effects: { grain: 0, vignette: 0, imageTreatment: 'none', borderWidth: 1, rule: 1 },
      textStyles: typeScale(
        'sans',
        'sans',
        'mono',
        { ink: '#141414', inkSoft: '#8A8378', accent: '#8A7C6D' },
        {
          display: { weight: 300, letterSpacing: -4 },
          heroName: { weight: 300, letterSpacing: -2.2 },
          title: { weight: 400, letterSpacing: -0.8 },
          quote: { family: 'serif', italic: true },
        }
      ),
    },
  },

  /* ── 04 Bloom ─────────────────────────────────────────────────────────── */
  {
    id: 'bloom',
    name: 'Bloom',
    description: 'Warm and friendly. Blush paper, plum ink, coral accent, softened corners.',
    sortOrder: 40,
    tokens: {
      colors: {
        background: '#FBEDE6',
        surface: '#FFF7F3',
        surfaceAlt: '#F4DDD2',
        ink: '#3D2233',
        inkSoft: '#8A6274',
        accent: '#E2674F',
        accentInk: '#FFF7F3',
        border: '#EBD1C5',
        highlight: '#5B8C7B',
      },
      fonts: { heading: 'sans', body: 'sans', mono: 'mono' },
      radius: { card: 28, image: 24, pill: 999 },
      spacing,
      effects: { grain: 0, vignette: 0, imageTreatment: 'warm', borderWidth: 2, rule: 2 },
      textStyles: typeScale(
        'sans',
        'sans',
        'mono',
        { ink: '#3D2233', inkSoft: '#8A6274', accent: '#E2674F' },
        {
          display: { weight: 700, letterSpacing: -3 },
          heroName: { weight: 700, letterSpacing: -1.8 },
          title: { weight: 600 },
          quote: { family: 'serif', italic: true },
          stat: { weight: 700 },
        }
      ),
    },
  },

  /* ── 05 Midnight ──────────────────────────────────────────────────────── */
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Interface-inspired. Deep navy, ice type, an electric line, everything in mono.',
    sortOrder: 50,
    tokens: {
      colors: {
        background: '#0B1120',
        surface: '#111A2E',
        surfaceAlt: '#18243D',
        ink: '#E8EEF9',
        inkSoft: '#8FA3C4',
        accent: '#79C0FF',
        accentInk: '#0B1120',
        border: '#26344F',
        highlight: '#7EE7C7',
      },
      fonts: { heading: 'sans', body: 'sans', mono: 'mono' },
      radius: { card: 16, image: 12, pill: 8 },
      spacing,
      effects: { grain: 0.03, vignette: 0.2, imageTreatment: 'cool', borderWidth: 1, rule: 1 },
      textStyles: typeScale(
        'sans',
        'sans',
        'mono',
        { ink: '#E8EEF9', inkSoft: '#8FA3C4', accent: '#79C0FF' },
        {
          display: { weight: 600, letterSpacing: -3.5 },
          heroName: { weight: 600, letterSpacing: -2 },
          title: { weight: 500, letterSpacing: -0.6 },
          label: { size: 18, letterSpacing: 3 },
          quote: { family: 'sans', italic: false, weight: 300 },
          stat: { family: 'mono', weight: 500, letterSpacing: -2 },
        }
      ),
    },
  },

  /* ── 06 Sepia ─────────────────────────────────────────────────────────── */
  {
    id: 'sepia',
    name: 'Sepia',
    description: 'Found in a drawer. Toned paper, heavy grain, every photograph aged.',
    sortOrder: 60,
    tokens: {
      colors: {
        background: '#E7DAC3',
        surface: '#F2E8D5',
        surfaceAlt: '#D8C7A9',
        ink: '#2A2118',
        inkSoft: '#7A6647',
        accent: '#A2542D',
        accentInk: '#F2E8D5',
        border: '#C9B694',
        highlight: '#5C6B4A',
      },
      fonts: { heading: 'display', body: 'serif', mono: 'mono' },
      radius: { card: 0, image: 0, pill: 999 },
      spacing,
      effects: { grain: 0.14, vignette: 0.3, imageTreatment: 'sepia', borderWidth: 2, rule: 1 },
      textStyles: typeScale(
        'display',
        'serif',
        'mono',
        { ink: '#2A2118', inkSoft: '#7A6647', accent: '#A2542D' },
        {
          display: { letterSpacing: -1.5 },
          label: { letterSpacing: 3.4 },
          quote: { family: 'display', italic: true },
        }
      ),
    },
  },

  /* ── 07 Garden ────────────────────────────────────────────────────────── */
  {
    id: 'garden',
    name: 'Garden',
    description: 'Bottle green field, cream type, brass accent. Formal without being cold.',
    sortOrder: 70,
    tokens: {
      colors: {
        background: '#16342E',
        surface: '#1D4238',
        surfaceAlt: '#0F2620',
        ink: '#F2EFE4',
        inkSoft: '#A8BDAF',
        accent: '#D9A441',
        accentInk: '#16342E',
        border: '#2E5A4D',
        highlight: '#E8C87E',
      },
      fonts: { heading: 'display', body: 'sans', mono: 'mono' },
      radius: { card: 4, image: 4, pill: 999 },
      spacing,
      effects: { grain: 0.06, vignette: 0.25, imageTreatment: 'warm', borderWidth: 2, rule: 1 },
      textStyles: typeScale(
        'display',
        'sans',
        'mono',
        { ink: '#F2EFE4', inkSoft: '#A8BDAF', accent: '#D9A441' },
        { display: { letterSpacing: -2 }, quote: { family: 'display', italic: true } }
      ),
    },
  },
]
