import type { AlbumElement, AlbumPageSide, AlbumSpread } from '@/components/album-editor/types'

/**
 * Spread composition primitives.
 *
 * The old catalogue declared every template as ~80 lines of hand-written
 * element JSON, which is why only three of the eight were ever really authored
 * — the rest were `cloneTemplateSpreads` of those three under different names.
 * Composing from named layouts instead means a new template is a list of page
 * compositions, and two templates differ because their *geometry* differs
 * rather than because their title does.
 *
 * Coordinates are in page units: the editor renders a page 700 × 1000 and
 * scales from there, so these numbers are resolution-independent.
 */

export const PAGE_W = 700
export const PAGE_H = 1000

export interface PaletteSpec {
  /** Page stock. */
  paper: string
  /** Body and heading ink. */
  ink: string
  /** Used for rules, mats, and small marks. */
  accent: string
  /** Full-bleed pages that carry type sit on this. */
  dark: string
}

interface Ctx {
  id: string
  palette: PaletteSpec
  /** Monotonic counter so every element id in a template is unique. */
  n: () => number
}

/* ── Element helpers ──────────────────────────────────────────────────────── */

function img(
  ctx: Ctx,
  x: number,
  y: number,
  width: number,
  height: number,
  zIndex = 1
): AlbumElement {
  return {
    id: `${ctx.id}-i${ctx.n()}`,
    type: 'image',
    name: 'Photo',
    // Empty on purpose: the frame is a slot, filled by the user's own photos
    // when the template is applied (see autoFillAlbum).
    src: '',
    x,
    y,
    width,
    height,
    rotation: 0,
    zIndex,
    fitMode: 'fill',
  }
}

function text(
  ctx: Ctx,
  value: string,
  opts: {
    x: number
    y: number
    width: number
    size: number
    align?: 'left' | 'center' | 'right'
    weight?: 'normal' | 'bold'
    family?: string
    fill?: string
    z?: number
    tracking?: number
  }
): AlbumElement {
  return {
    id: `${ctx.id}-t${ctx.n()}`,
    type: 'text',
    name: 'Text',
    text: value,
    fontSize: opts.size,
    fontFamily: opts.family ?? 'serif',
    fontWeight: opts.weight ?? 'normal',
    textAlign: opts.align ?? 'left',
    letterSpacing: opts.tracking,
    fill: opts.fill ?? ctx.palette.ink,
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: Math.round(opts.size * 1.35),
    rotation: 0,
    zIndex: opts.z ?? 2,
  }
}

function rule(ctx: Ctx, x: number, y: number, width: number, thickness = 2): AlbumElement {
  return {
    id: `${ctx.id}-r${ctx.n()}`,
    type: 'shape',
    name: 'Rule',
    shapeType: 'rectangle',
    fill: ctx.palette.accent,
    x,
    y,
    width,
    height: thickness,
    rotation: 0,
    zIndex: 3,
  }
}

/* ── Page compositions ────────────────────────────────────────────────────── */

export type PageLayout = (ctx: Ctx) => AlbumPageSide

/** One photograph, edge to edge. The loudest page in any template. */
export const fullBleed: PageLayout = (ctx) => ({
  background: ctx.palette.dark,
  elements: [img(ctx, 0, 0, PAGE_W, PAGE_H)],
})

/** A photograph floated inside a generous mat — the quietest page. */
export function matted(inset = 90): PageLayout {
  return (ctx) => ({
    background: ctx.palette.paper,
    elements: [img(ctx, inset, inset, PAGE_W - inset * 2, PAGE_H - inset * 2)],
  })
}

/** Two photographs stacked, with a hairline between them. */
export const duo: PageLayout = (ctx) => {
  const m = 60
  const h = (PAGE_H - m * 3) / 2
  return {
    background: ctx.palette.paper,
    elements: [
      img(ctx, m, m, PAGE_W - m * 2, h),
      img(ctx, m, m * 2 + h, PAGE_W - m * 2, h),
    ],
  }
}

/** A 2 × 2 grid — the densest page, for contact-sheet stretches. */
export const quad: PageLayout = (ctx) => {
  const m = 50
  const g = 12
  const w = (PAGE_W - m * 2 - g) / 2
  const h = (PAGE_H - m * 2 - g) / 2
  return {
    background: ctx.palette.paper,
    elements: [
      img(ctx, m, m, w, h),
      img(ctx, m + w + g, m, w, h),
      img(ctx, m, m + h + g, w, h),
      img(ctx, m + w + g, m + h + g, w, h),
    ],
  }
}

/** One tall frame beside two stacked squares. */
export const triptych: PageLayout = (ctx) => {
  const m = 50
  const g = 12
  const big = Math.round((PAGE_W - m * 2 - g) * 0.62)
  const small = PAGE_W - m * 2 - g - big
  const h = PAGE_H - m * 2
  const sh = (h - g) / 2
  return {
    background: ctx.palette.paper,
    elements: [
      img(ctx, m, m, big, h),
      img(ctx, m + big + g, m, small, sh),
      img(ctx, m + big + g, m + sh + g, small, sh),
    ],
  }
}

/** A photograph in the upper two-thirds, a caption block beneath. */
export function captioned(heading: string, body: string): PageLayout {
  return (ctx) => {
    const m = 70
    const h = 620
    return {
      background: ctx.palette.paper,
      elements: [
        img(ctx, m, m, PAGE_W - m * 2, h),
        rule(ctx, m, m + h + 44, 90),
        text(ctx, heading, { x: m, y: m + h + 72, width: PAGE_W - m * 2, size: 34 }),
        text(ctx, body, {
          x: m,
          y: m + h + 128,
          width: PAGE_W - m * 2,
          size: 16,
          family: 'sans-serif',
        }),
      ],
    }
  }
}

/** Type only — a chapter break. */
export function chapter(kicker: string, title: string): PageLayout {
  return (ctx) => ({
    background: ctx.palette.paper,
    elements: [
      text(ctx, kicker, {
        x: 70,
        y: 400,
        width: PAGE_W - 140,
        size: 14,
        family: 'monospace',
        fill: ctx.palette.accent,
        tracking: 4,
      }),
      rule(ctx, 70, 440, 60),
      text(ctx, title, { x: 70, y: 476, width: PAGE_W - 140, size: 52 }),
    ],
  })
}

/** The cover: a full-bleed photograph with the title set over it. */
export function cover(title: string, kicker?: string): PageLayout {
  return (ctx) => ({
    background: ctx.palette.dark,
    elements: [
      img(ctx, 0, 0, PAGE_W, PAGE_H),
      ...(kicker
        ? [
            text(ctx, kicker, {
              x: 60,
              y: 740,
              width: PAGE_W - 120,
              size: 14,
              family: 'monospace',
              fill: '#F5F0E8',
              tracking: 5,
              z: 4,
            }),
          ]
        : []),
      text(ctx, title, {
        x: 60,
        y: 790,
        width: PAGE_W - 120,
        size: 62,
        weight: 'bold',
        fill: '#F5F0E8',
        z: 4,
      }),
    ],
  })
}

/* ── Assembly ─────────────────────────────────────────────────────────────── */

/**
 * Builds the spread list for a template from a list of page compositions.
 * The first page becomes the cover; the rest pair up front/back into spreads,
 * which is how the editor and the 3D viewer both expect them.
 */
export function buildSpreads(
  id: string,
  palette: PaletteSpec,
  pages: PageLayout[]
): AlbumSpread[] {
  let counter = 0
  const ctx: Ctx = { id, palette, n: () => ++counter }

  const [coverPage, ...inner] = pages
  const spreads: AlbumSpread[] = []

  const coverSide = coverPage(ctx)
  spreads.push({
    id: `${id}-s0`,
    isCover: true,
    background: coverSide.background,
    elements: coverSide.elements,
    front: coverSide,
  })

  for (let i = 0; i < inner.length; i += 2) {
    const front = inner[i](ctx)
    const back = inner[i + 1] ? inner[i + 1](ctx) : undefined
    spreads.push({
      id: `${id}-s${spreads.length}`,
      background: front.background,
      elements: front.elements,
      front,
      ...(back ? { back } : {}),
    })
  }

  return spreads
}
