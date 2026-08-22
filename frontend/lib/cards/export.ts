/**
 * The export engine.
 *
 * A card is already an SVG document in canvas units, so exporting is mostly a
 * matter of asking the browser to rasterise it at a different size. That is the
 * pay-off for rendering SVG rather than HTML: there is no second renderer to
 * keep in step, and a 2160px export is the preview, larger.
 *
 * The one genuine complication is images. An SVG loaded as an image runs in a
 * restricted mode where it may not fetch anything, so every photograph has to
 * be embedded as a data URI before rasterising — which also sidesteps canvas
 * tainting, since a data URI can never taint.
 */

export type ExportFormat = 'png' | 'jpeg'

export interface ExportOptions {
  width: number
  height: number
  format?: ExportFormat
  quality?: number
  /** Painted under the card. Only matters for JPEG, which has no alpha. */
  background?: string
}

const XLINK = 'http://www.w3.org/1999/xlink'

/** One cache per session: the same portrait is exported at several sizes. */
const dataUriCache = new Map<string, string>()

async function toDataUri(url: string): Promise<string | null> {
  if (url.startsWith('data:')) return url
  const cached = dataUriCache.get(url)
  if (cached) return cached

  try {
    const response = await fetch(url, { mode: 'cors', credentials: 'omit' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const blob = await response.blob()

    const encoded = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error ?? new Error('Could not read the image.'))
      reader.readAsDataURL(blob)
    })

    if (dataUriCache.size > 40) dataUriCache.clear()
    dataUriCache.set(url, encoded)
    return encoded
  } catch (error) {
    console.warn('[cards] Could not embed image for export:', url, error)
    return null
  }
}

/**
 * Replaces every remote image reference with an inline copy. Images that cannot
 * be fetched are dropped rather than left pointing at a URL the rasteriser will
 * silently ignore — a visible gap is easier to explain than a mystery.
 */
async function inlineImages(svg: SVGSVGElement): Promise<number> {
  const images = Array.from(svg.querySelectorAll('image'))
  const urls = new Set<string>()

  for (const image of images) {
    const href = image.getAttribute('href') ?? image.getAttributeNS(XLINK, 'href')
    if (href && !href.startsWith('data:')) urls.add(href)
  }

  const resolved = new Map<string, string | null>()
  await Promise.all(
    Array.from(urls).map(async (url) => {
      resolved.set(url, await toDataUri(url))
    })
  )

  let failures = 0
  for (const image of images) {
    const href = image.getAttribute('href') ?? image.getAttributeNS(XLINK, 'href')
    if (!href || href.startsWith('data:')) continue
    const embedded = resolved.get(href)
    if (embedded) {
      image.setAttribute('href', embedded)
      image.removeAttributeNS(XLINK, 'href')
    } else {
      failures += 1
      image.remove()
    }
  }

  return failures
}

/** Serialises a detached copy at the requested pixel size. */
async function prepareSvg(source: SVGSVGElement, options: ExportOptions): Promise<string> {
  const clone = source.cloneNode(true) as SVGSVGElement

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('xmlns:xlink', XLINK)
  clone.setAttribute('width', String(options.width))
  clone.setAttribute('height', String(options.height))

  // Selection outlines and cursors belong to the editor, not to the export.
  clone.querySelectorAll('[data-editor-only]').forEach((node) => node.remove())
  clone.querySelectorAll('[stroke-dasharray="10 8"]').forEach((node) => node.remove())

  await inlineImages(clone)

  return new XMLSerializer().serializeToString(clone)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('The card could not be rasterised.'))
    image.src = src
  })
}

/**
 * Rasterises a live card into an image blob.
 *
 * `source` is the `<svg>` element the renderer put on the page — the very same
 * node the user has been looking at, which is what makes this WYSIWYG rather
 * than a re-render that hopes to match.
 */
export async function exportCardBlob(
  source: SVGSVGElement,
  options: ExportOptions
): Promise<Blob> {
  const format = options.format ?? 'png'
  const markup = await prepareSvg(source, options)

  const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)

  try {
    const image = await loadImage(objectUrl)
    const canvas = document.createElement('canvas')
    canvas.width = options.width
    canvas.height = options.height

    const context = canvas.getContext('2d')
    if (!context) throw new Error('This browser cannot render the export canvas.')

    // JPEG has no alpha, so anything not painted would come out black.
    if (format === 'jpeg' || options.background) {
      context.fillStyle = options.background ?? '#FFFFFF'
      context.fillRect(0, 0, options.width, options.height)
    }

    context.drawImage(image, 0, 0, options.width, options.height)

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result)
          else reject(new Error('The export could not be encoded.'))
        },
        format === 'jpeg' ? 'image/jpeg' : 'image/png',
        format === 'jpeg' ? (options.quality ?? 0.92) : undefined
      )
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export function fileNameFor(title: string, options: ExportOptions): string {
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'card'
  return `${slug}-${options.width}x${options.height}.${options.format ?? 'png'}`
}

/** Hands the finished image to the browser as a download. */
export async function downloadCard(
  source: SVGSVGElement,
  title: string,
  options: ExportOptions
): Promise<void> {
  const blob = await exportCardBlob(source, options)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileNameFor(title, options)
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revoking immediately can cancel the download in Safari.
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export function canShareFiles(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    typeof navigator.share === 'function'
  )
}

/**
 * The phone path: hands the image straight to Instagram, WhatsApp or Messages
 * through the system share sheet. Returns false when the browser has no share
 * sheet, so the caller can fall back to a download.
 */
export async function shareCard(
  source: SVGSVGElement,
  title: string,
  options: ExportOptions
): Promise<boolean> {
  if (!canShareFiles()) return false

  const blob = await exportCardBlob(source, options)
  const file = new File([blob], fileNameFor(title, options), { type: blob.type })

  if (!navigator.canShare({ files: [file] })) return false

  try {
    await navigator.share({ files: [file], title })
    return true
  } catch (error) {
    // A cancelled share sheet is not a failure worth reporting.
    if ((error as Error)?.name === 'AbortError') return true
    throw error
  }
}
