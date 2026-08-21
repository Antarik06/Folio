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
  return (Object.keys(DEFAULT_FILTERS) as (keyof PhotoFilters)[]).every(
    (k) => f[k] === DEFAULT_FILTERS[k]
  )
}

/**
 * Bakes the grade into a JPEG.
 *
 * The vignette and the fade are overlays in the preview, so they have to be
 * painted here too or the export would not match what was on screen.
 */
export async function renderEditedPhoto(
  imageUrl: string,
  filters: PhotoFilters,
  quality = 0.95
): Promise<Blob> {
  const img = await loadImage(imageUrl)

  const rotated = Math.abs(filters.rotation % 180) === 90
  const w = rotated ? img.naturalHeight : img.naturalWidth
  const h = rotated ? img.naturalWidth : img.naturalHeight

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is unavailable in this browser.')

  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.rotate((filters.rotation * Math.PI) / 180)
  ctx.scale(filters.flipH ? -1 : 1, filters.flipV ? -1 : 1)
  ctx.filter = buildCssFilter(filters)
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
  ctx.restore()

  // Fade lifts the blacks with a thin white wash.
  if (filters.fade > 0) {
    ctx.fillStyle = `rgba(255,255,255,${(filters.fade / 100) * 0.35})`
    ctx.fillRect(0, 0, w, h)
  }

  // Vignette darkens the corners.
  if (filters.vignette > 0) {
    const grad = ctx.createRadialGradient(
      w / 2, h / 2, Math.min(w, h) * 0.25,
      w / 2, h / 2, Math.max(w, h) * 0.75
    )
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, `rgba(0,0,0,${(filters.vignette / 100) * 0.85})`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the image.'))),
      'image/jpeg',
      quality
    )
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
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
