import { autoFillAlbum } from '@/lib/template-engine-utils'

/**
 * Spread resolution for the album editor.
 *
 * This was duplicated verbatim across the two editor routes that existed
 * before the Create tab consolidated them (/editor/[id] and
 * /dashboard/templates/editor/[id]). They were the same AlbumEditor with a
 * different `mode` prop, so the logic lives here once and both entry points —
 * now one route with a `mode` search param — call it.
 */

const SPREAD_WIDTH = 700
const SPREAD_HEIGHT = 1000

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

/** The album's event id, under either of the two casings the API returns. */
export function resolveEventId(album: any): string | null {
  if (isUuid(album?.event_id)) return album.event_id
  if (isUuid(album?.eventId)) return album.eventId
  return null
}

/** Albums store their layout under one of two column names depending on age. */
export function resolveLayoutField(album: any): 'layout_data' | 'theme_config' {
  return Object.prototype.hasOwnProperty.call(album ?? {}, 'layout_data')
    ? 'layout_data'
    : 'theme_config'
}

function backgroundElement(id: string, src: string) {
  return {
    id,
    type: 'image',
    name: 'Page Background',
    src,
    x: 0,
    y: 0,
    width: SPREAD_WIDTH,
    height: SPREAD_HEIGHT,
    zIndex: 0,
    rotation: 0,
    fitMode: 'fill',
    locked: true,
  }
}

/**
 * Re-attaches the "Page Background" image element to spreads that were saved
 * before backgrounds were modelled as elements. Without this, an older album
 * opens in the editor with its rendered page previews missing.
 */
function healBackgrounds(spreads: any[], previews: string[]): any[] {
  return spreads.map((spread: any, idx: number) => {
    const cloned = { ...spread }

    if (cloned.isCover) {
      const hasBg = cloned.elements?.some((el: any) => el.id === 'bg-image-1')
      if (!hasBg && previews[0]) {
        const coverBg = backgroundElement('bg-image-1', previews[0])
        cloned.elements = [coverBg, ...(cloned.elements || [])]
        if (cloned.front) {
          cloned.front.elements = [coverBg, ...(cloned.front.elements || [])]
        }
      }
      return cloned
    }

    const leftPageNum = idx * 2
    const rightPageNum = leftPageNum + 1
    const previewL = previews[leftPageNum - 1]
    const previewR = previews[rightPageNum - 1]

    if (cloned.front) {
      const hasBgL = cloned.front.elements?.some(
        (el: any) => el.id === `bg-image-${leftPageNum}`
      )
      if (!hasBgL && previewL) {
        const bgL = backgroundElement(`bg-image-${leftPageNum}`, previewL)
        cloned.front.elements = [bgL, ...(cloned.front.elements || [])]
        cloned.elements = cloned.front.elements
      }
    }

    if (cloned.back) {
      const hasBgR = cloned.back.elements?.some(
        (el: any) => el.id === `bg-image-${rightPageNum}`
      )
      if (!hasBgR && previewR) {
        const bgR = backgroundElement(`bg-image-${rightPageNum}`, previewR)
        cloned.back.elements = [bgR, ...(cloned.back.elements || [])]
      }
    }

    return cloned
  })
}

export interface ResolvedAlbumLayout {
  rawLayout: any
  initialSpreads: any[] | undefined
  layoutField: 'layout_data' | 'theme_config'
}

/**
 * Turns whatever shape an album's layout was persisted in into the spreads the
 * editor expects: existing spreads, a `layout_schema` pages array converted to
 * spreads, or nothing.
 */
export function resolveAlbumLayout(album: any): ResolvedAlbumLayout {
  const rawLayout = album?.layout_data ?? album?.theme_config ?? null

  let initialSpreads =
    Array.isArray(rawLayout?.spreads) && rawLayout.spreads.length > 0
      ? rawLayout.spreads
      : undefined

  if (!initialSpreads && Array.isArray(rawLayout?.layout_schema?.pages)) {
    const converted = autoFillAlbum(
      [],
      rawLayout.layout_schema,
      rawLayout.page_previews_urls || album?.page_previews_urls
    )
    if (converted.length > 0) {
      initialSpreads = converted
    }
  }

  const previews = rawLayout?.page_previews_urls || album?.page_previews_urls
  if (initialSpreads && Array.isArray(previews) && previews.length > 0) {
    initialSpreads = healBackgrounds(initialSpreads, previews)
  }

  return {
    rawLayout,
    initialSpreads,
    layoutField: resolveLayoutField(album),
  }
}
