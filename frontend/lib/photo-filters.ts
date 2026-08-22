/**
 * The photo filter engine.
 *
 * Extracted so the two places that adjust a photograph can share the maths
 * while looking nothing alike: the lightbox editor inside an event gallery,
 * and the Photo Studio in the Create tab. Chrome differs, grading does not.
 */

export interface PhotoFilters {
  brightness: number
  contrast: number
  saturation: number
  /** hue-rotate degrees; positive reads warmer */
  warmth: number
  sepia: number
  highlights: number
  shadows: number
  /** lifts blacks — the matte look */
  fade: number
  vignette: number
  rotation: number
  flipH: boolean
  flipV: boolean
  /**
   * The kept rectangle, normalised 0–1 against the *source* image and applied
   * before rotation. `null` is the whole frame.
   */
  crop: CropRect | null
}

export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

export const DEFAULT_FILTERS: PhotoFilters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  warmth: 0,
  sepia: 0,
  highlights: 0,
  shadows: 0,
  fade: 0,
  vignette: 0,
  rotation: 0,
  flipH: false,
  flipV: false,
  crop: null,
}

export interface FilmStock {
  name: string
  /** ISO-ish subtitle, so the strip reads as a shelf of film. */
  note: string
  /** Swatch shown on the film strip. */
  swatch: string
  filters: Partial<PhotoFilters>
}

/**
 * Named after the stocks they imitate. Ordered warm → neutral → cold, so
 * scrubbing the strip moves through a temperature range rather than jumping.
 */
export const FILM_STOCKS: FilmStock[] = [
  { name: 'Original', note: 'No stock', swatch: 'linear-gradient(135deg,#ccc,#888)', filters: { ...DEFAULT_FILTERS } },
  {
    name: 'Golden Hour',
    note: 'Warm · 100',
    swatch: 'linear-gradient(135deg,#f7b731,#e8590c)',
    filters: { brightness: 110, contrast: 105, saturation: 115, warmth: 30, sepia: 15, fade: 10, vignette: 30 },
  },
  {
    name: 'Portra 400',
    note: 'Portrait · 400',
    swatch: 'linear-gradient(135deg,#d4a373,#e9c46a)',
    filters: { brightness: 108, contrast: 95, saturation: 90, warmth: 18, sepia: 12, fade: 18, vignette: 15 },
  },
  {
    name: 'Kodachrome',
    note: 'Slide · 64',
    swatch: 'linear-gradient(135deg,#c0392b,#e67e22)',
    filters: { brightness: 105, contrast: 115, saturation: 120, warmth: 12, sepia: 8, fade: 5, vignette: 25 },
  },
  {
    name: 'Polaroid',
    note: 'Instant · 600',
    swatch: 'linear-gradient(135deg,#ffe066,#b5e8d7)',
    filters: { brightness: 112, contrast: 90, saturation: 95, warmth: 8, sepia: 20, fade: 22, vignette: 40 },
  },
  {
    name: 'Matte',
    note: 'Lifted black',
    swatch: 'linear-gradient(135deg,#aab,#dde)',
    filters: { brightness: 103, contrast: 88, saturation: 85, warmth: 5, sepia: 0, fade: 32, vignette: 10 },
  },
  {
    name: 'Lomo',
    note: 'Cross · 200',
    swatch: 'linear-gradient(135deg,#e63946,#f4a261)',
    filters: { brightness: 95, contrast: 140, saturation: 160, warmth: -15, sepia: 0, fade: 0, vignette: 55 },
  },
  {
    name: 'Ilford HP5',
    note: 'Mono · 400',
    swatch: 'linear-gradient(135deg,#555,#bbb)',
    filters: { brightness: 105, contrast: 125, saturation: 0, warmth: 0, sepia: 0, fade: 8, vignette: 35 },
  },
  {
    name: 'Noir',
    note: 'Mono · high con',
    swatch: 'linear-gradient(135deg,#111,#555)',
    filters: { brightness: 92, contrast: 140, saturation: 0, warmth: 0, sepia: 5, fade: 0, vignette: 60 },
  },
]

/**
 * The CSS filter chain for a live preview.
 *
 * Highlights and shadows are approximated on top of brightness/contrast —
 * a real tone curve would need a canvas pass, and this is close enough to
 * preview honestly before the export bakes it.
 */
export function buildCssFilter(f: PhotoFilters): string {
  const brightnessAdj = f.brightness + f.highlights * 0.15 - f.shadows * 0.08
  const contrastAdj = f.contrast + (f.shadows < 0 ? Math.abs(f.shadows) * 0.2 : 0)

  return [
    `brightness(${Math.max(0, brightnessAdj)}%)`,
    `contrast(${Math.max(0, contrastAdj)}%)`,
    `saturate(${f.saturation}%)`,
    `sepia(${f.sepia}%)`,
    `hue-rotate(${f.warmth}deg)`,
  ].join(' ')
}

/** The transform for rotation and flips, shared by preview and export. */
export function buildTransform(f: PhotoFilters): string {
  return [
    `rotate(${f.rotation}deg)`,
    `scaleX(${f.flipH ? -1 : 1})`,
    `scaleY(${f.flipV ? -1 : 1})`,
  ].join(' ')
}

/** True when nothing has been changed from the stock image. */
export function isUntouched(f: PhotoFilters): boolean {
  return (Object.keys(DEFAULT_FILTERS) as (keyof PhotoFilters)[]).every((k) =>
    k === 'crop' ? !f.crop : f[k] === DEFAULT_FILTERS[k]
  )
}

/**
 * Where the kept rectangle lands, and how big the result is.
 *
 * `maxEdge` caps the long edge — the live preview paints at screen size, the
 * export paints at full size, and both go through here so they cannot drift
 * apart.
 */
function measureOutput(
  naturalWidth: number,
  naturalHeight: number,
  filters: PhotoFilters,
  maxEdge?: number
) {
  const crop = filters.crop
  const cw = Math.max(1, Math.round((crop ? crop.width : 1) * naturalWidth))
  const ch = Math.max(1, Math.round((crop ? crop.height : 1) * naturalHeight))
  const cx = Math.round((crop ? crop.x : 0) * naturalWidth)
  const cy = Math.round((crop ? crop.y : 0) * naturalHeight)

  // The crop comes off the source first, so rotation turns the kept rectangle
  // rather than the whole negative.
  const quarterTurned = Math.abs(filters.rotation % 180) === 90
  const fullW = quarterTurned ? ch : cw
  const fullH = quarterTurned ? cw : ch

  const scale = maxEdge ? Math.min(1, maxEdge / Math.max(fullW, fullH)) : 1

  return {
    cx,
    cy,
    cw,
    ch,
    scale,
    width: Math.max(1, Math.round(fullW * scale)),
    height: Math.max(1, Math.round(fullH * scale)),
  }
}

/**
 * Paints one graded frame onto a canvas, sizing the canvas to match.
 *
 * The fade and the vignette are painted here rather than layered in CSS, so
 * the preview on screen and the JPEG that gets saved are the same picture.
 */
export function paintPhoto(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  filters: PhotoFilters,
  maxEdge?: number
) {
  const { cx, cy, cw, ch, scale, width, height } = measureOutput(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    filters,
    maxEdge
  )

  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is unavailable in this browser.')

  ctx.clearRect(0, 0, width, height)
  ctx.save()
  ctx.translate(width / 2, height / 2)
  ctx.rotate((filters.rotation * Math.PI) / 180)
  ctx.scale(filters.flipH ? -1 : 1, filters.flipV ? -1 : 1)
  ctx.filter = buildCssFilter(filters)
  ctx.drawImage(img, cx, cy, cw, ch, (-cw * scale) / 2, (-ch * scale) / 2, cw * scale, ch * scale)
  ctx.restore()

  // Fade lifts the blacks with a thin white wash.
  if (filters.fade > 0) {
    ctx.fillStyle = `rgba(255,255,255,${(filters.fade / 100) * 0.35})`
    ctx.fillRect(0, 0, width, height)
  }

  // Vignette darkens the corners.
  if (filters.vignette > 0) {
    const grad = ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.25,
      width / 2, height / 2, Math.max(width, height) * 0.75
    )
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, `rgba(0,0,0,${(filters.vignette / 100) * 0.85})`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)
  }
}

/** Bakes the grade into a JPEG at full resolution. */
export async function renderEditedPhoto(
  imageUrl: string,
  filters: PhotoFilters,
  quality = 0.95
): Promise<Blob> {
  const img = await loadImage(imageUrl)
  const canvas = document.createElement('canvas')
  paintPhoto(canvas, img, filters)

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the image.'))),
      'image/jpeg',
      quality
    )
  })
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    // Supabase serves these cross-origin; without this the canvas taints and
    // toBlob throws a security error on export.
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load that photograph.'))
    img.src = src
  })
}
