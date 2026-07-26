import { AlbumSpread, AlbumElement, AlbumPageSide } from '@/components/album-editor/types'

const SPREAD_WIDTH = 700
const SPREAD_HEIGHT = 1000

export function getAlbumAspectRatio(album: any): number {
  const layout = album?.layout_data ?? album?.theme_config ?? album ?? null
  const schema = layout?.layout_schema ?? album?.layout_schema ?? null
  
  if (schema?.page_size?.width_mm && schema?.page_size?.height_mm) {
    const ratio = schema.page_size.width_mm / schema.page_size.height_mm
    if (ratio > 0 && !isNaN(ratio)) {
      return ratio
    }
  }

  // Fallback: search spreads for a page background
  const spreads = layout?.spreads || album?.spreads || []
  for (const spread of spreads) {
    const elements = spread.elements || spread.front?.elements || []
    const bgEl = elements.find((el: any) => el.id?.startsWith('bg-image-') || el.name === 'Page Background')
    if (bgEl && bgEl.width && bgEl.height) {
      const ratio = bgEl.width / bgEl.height
      if (ratio > 0 && !isNaN(ratio)) {
        return ratio
      }
    }
  }

  return 0.7 // Default 7:10
}

export interface ResolutionCheckResult {
  status: 'ok' | 'warning' | 'error'
  message?: string
}

/**
 * Checks photo resolution against slot size and min_dpi.
 */
export function checkResolution(
  photoWidth: number,
  photoHeight: number,
  slotWidthMm: number,
  slotHeightMm: number,
  minDpi = 300
): ResolutionCheckResult {
  const slotWidthInches = slotWidthMm / 25.4
  const slotHeightInches = slotHeightMm / 25.4
  
  const requiredPixelsWidth = slotWidthInches * minDpi
  const requiredPixelsHeight = slotHeightInches * minDpi
  
  if (photoWidth < requiredPixelsWidth || photoHeight < requiredPixelsHeight) {
    const errorLimitWidth = requiredPixelsWidth * 0.67
    const errorLimitHeight = requiredPixelsHeight * 0.67
    
    if (photoWidth < errorLimitWidth || photoHeight < errorLimitHeight) {
      return {
        status: 'error',
        message: `Low resolution (below 200 DPI equivalent) for this slot. Required: ${Math.round(requiredPixelsWidth)}x${Math.round(requiredPixelsHeight)}px.`
      }
    } else {
      return {
        status: 'warning',
        message: `Sub-optimal resolution (below 300 DPI). Required: ${Math.round(requiredPixelsWidth)}x${Math.round(requiredPixelsHeight)}px.`
      }
    }
  }
  
  return { status: 'ok' }
}

interface AutoFillPhoto {
  id: string
  blob_url: string
  width?: number
  height?: number
  taken_at?: string
  exif_data?: any
  created_at?: string
}

/**
 * Groups and sorts photos chronologically using EXIF or created date.
 * Module-private: only autoFillAlbum consumes it.
 */
function smartSortPhotos(photos: AutoFillPhoto[]): AutoFillPhoto[] {
  return [...photos].sort((a, b) => {
    const timeA = new Date(a.taken_at || a.exif_data?.DateTimeOriginal || a.created_at || 0).getTime()
    const timeB = new Date(b.taken_at || b.exif_data?.DateTimeOriginal || b.created_at || 0).getTime()
    return timeA - timeB
  })
}

/**
 * Auto-fills user photos into template slot configurations, applying aspect ratio matching.
 */
export function autoFillAlbum(
  photos: AutoFillPhoto[],
  schema: any,
  pagePreviewsUrls: string[] = []
): AlbumSpread[] {
  const sortedPhotos = smartSortPhotos(photos)

  // Determine aspect ratio and width dynamically
  let aspectRatio = 0.7
  const configWidthMm = schema?.page_size?.width_mm
  const configHeightMm = schema?.page_size?.height_mm
  if (configWidthMm && configHeightMm) {
    aspectRatio = configWidthMm / configHeightMm
  } else if (schema && (Array.isArray(schema.spreads) || Array.isArray(schema))) {
    const targetSpreads = Array.isArray(schema) ? schema : schema.spreads
    for (const spread of targetSpreads) {
      const elements = spread.elements || spread.front?.elements || []
      const bgEl = elements.find((el: any) => el.id?.startsWith('bg-image-') || el.name === 'Page Background')
      if (bgEl && bgEl.width && bgEl.height) {
        aspectRatio = bgEl.width / bgEl.height
        break
      }
    }
  }

  const SPREAD_HEIGHT = 1000
  const SPREAD_WIDTH = Math.round(SPREAD_HEIGHT * aspectRatio)

  // Fallback: If schema is an array of spreads or has spreads directly, fill its image elements
  if (schema && (Array.isArray(schema.spreads) || Array.isArray(schema))) {
    const targetSpreads = Array.isArray(schema) ? schema : schema.spreads
    const clonedSpreads: AlbumSpread[] = JSON.parse(JSON.stringify(targetSpreads))
    const unassigned = [...sortedPhotos]

    clonedSpreads.forEach(spread => {
      const processElements = (elements: AlbumElement[]) => {
        if (!elements) return
        elements.forEach(el => {
          if (el.type === 'image') {
            if (el.locked && (el.name === 'Page Background' || el.id?.startsWith('bg-image-'))) {
              return
            }
            if (unassigned.length > 0) {
              const slotRatio = (el.width || 100) / (el.height || 100)
              let bestIdx = 0
              let minDiff = Infinity
              unassigned.forEach((photo, idx) => {
                const photoWidth = photo.width || 800
                const photoHeight = photo.height || 600
                const photoRatio = photoWidth / photoHeight
                const diff = Math.abs(photoRatio - slotRatio)
                if (diff < minDiff) {
                  minDiff = diff
                  bestIdx = idx
                }
              })
              const chosen = unassigned[bestIdx]
              el.src = chosen.blob_url
              unassigned.splice(bestIdx, 1)
            }
          }
        })
      }
      if (spread.elements) processElements(spread.elements)
      if (spread.front?.elements) processElements(spread.front.elements)
      if (spread.back?.elements) processElements(spread.back.elements)
    })
    return clonedSpreads
  }

  const pages = schema?.pages || []
  const pageWidthMm = schema?.page_size?.width_mm || 210
  const pageHeightMm = schema?.page_size?.height_mm || 297

  const unassignedPhotos = [...sortedPhotos]

  // Helper to map schema slots of a page to AlbumElements
  const mapSlotsToElements = (slots: any[] = [], pageNum: number): AlbumElement[] => {
    return slots.map(slot => {
      const isText = slot.type === 'text'
      const slotWidthPx = (slot.width_mm / pageWidthMm) * SPREAD_WIDTH
      const slotHeightPx = (slot.height_mm / pageHeightMm) * SPREAD_HEIGHT
      const slotXPx = (slot.x_mm / pageWidthMm) * SPREAD_WIDTH
      const slotYPx = (slot.y_mm / pageHeightMm) * SPREAD_HEIGHT

      const baseElement = {
        id: slot.slot_id || `slot_${pageNum}_${Math.random().toString(36).substring(2, 7)}`,
        x: Math.round(slotXPx),
        y: Math.round(slotYPx),
        width: Math.round(slotWidthPx),
        height: Math.round(slotHeightPx),
        rotation: 0,
        zIndex: slot.z_index || 1,
        locked: !slot.editable_by_user
      }

      if (isText) {
        return {
          ...baseElement,
          type: 'text',
          name: slot.slot_id,
          text: slot.placeholder_text || 'Enter text...',
          fontSize: Math.round((slot.font_size_pt || 14) * 1.5),
          fontFamily: slot.font_family || 'serif',
          fontWeight: 'normal',
          textAlign: 'left',
          fill: '#1c1814'
        } as AlbumElement
      } else {
        // Find best matching photo by aspect ratio
        let chosenPhoto: AutoFillPhoto | null = null
        if (unassignedPhotos.length > 0) {
          const slotRatio = slot.width_mm / slot.height_mm
          let bestIdx = 0
          let minDiff = Infinity

          unassignedPhotos.forEach((photo, idx) => {
            const photoWidth = photo.width || 800
            const photoHeight = photo.height || 600
            const photoRatio = photoWidth / photoHeight
            const diff = Math.abs(photoRatio - slotRatio)
            if (diff < minDiff) {
              minDiff = diff
              bestIdx = idx
            }
          })

          chosenPhoto = unassignedPhotos[bestIdx]
          unassignedPhotos.splice(bestIdx, 1)
        }

        return {
          ...baseElement,
          type: 'image',
          name: slot.slot_id,
          src: chosenPhoto?.blob_url || '',
          fitMode: 'fill',
          crop: { x: 0, y: 0, width: 1, height: 1 }
        } as AlbumElement
      }
    })
  }

  const spreadsList: AlbumSpread[] = []
  
  // 1. Build Cover spread (Page 1)
  const coverPage = pages.find((p: any) => p.page_number === 1) || { slots: [] }
  const coverElements = mapSlotsToElements(coverPage.slots, 1)

  if (pagePreviewsUrls && pagePreviewsUrls[0]) {
    coverElements.unshift({
      id: 'bg-image-1',
      type: 'image',
      name: 'Page Background',
      src: pagePreviewsUrls[0],
      x: 0,
      y: 0,
      width: SPREAD_WIDTH,
      height: SPREAD_HEIGHT,
      zIndex: 0,
      rotation: 0,
      fitMode: 'fill',
      locked: true
    } as AlbumElement)
  }

  spreadsList.push({
    id: 'spread-cover',
    isCover: true,
    background: '#FAF9F6',
    elements: coverElements,
    front: {
      background: '#FAF9F6',
      elements: coverElements
    },
    back: {
      background: '#FFFFFF',
      elements: []
    }
  })

  // 2. Build inner spreads (Pages 2-3, 4-5, etc.)
  let innerPageNum = 2
  while (innerPageNum <= pages.length) {
    const pageL = pages.find((p: any) => p.page_number === innerPageNum)
    const pageR = pages.find((p: any) => p.page_number === innerPageNum + 1)

    const elL = pageL ? mapSlotsToElements(pageL.slots, innerPageNum) : []
    const elR = pageR ? mapSlotsToElements(pageR.slots, innerPageNum + 1) : []

    if (pagePreviewsUrls) {
      const previewL = pagePreviewsUrls[innerPageNum - 1]
      if (previewL) {
        elL.unshift({
          id: `bg-image-${innerPageNum}`,
          type: 'image',
          name: 'Page Background',
          src: previewL,
          x: 0,
          y: 0,
          width: SPREAD_WIDTH,
          height: SPREAD_HEIGHT,
          zIndex: 0,
          rotation: 0,
          fitMode: 'fill',
          locked: true
        } as AlbumElement)
      }

      const previewR = pagePreviewsUrls[innerPageNum]
      if (previewR) {
        elR.unshift({
          id: `bg-image-${innerPageNum + 1}`,
          type: 'image',
          name: 'Page Background',
          src: previewR,
          x: 0,
          y: 0,
          width: SPREAD_WIDTH,
          height: SPREAD_HEIGHT,
          zIndex: 0,
          rotation: 0,
          fitMode: 'fill',
          locked: true
        } as AlbumElement)
      }
    }

    spreadsList.push({
      id: `spread-${Math.floor(innerPageNum / 2)}`,
      isCover: false,
      background: '#FFFFFF',
      elements: elL,
      front: {
        background: '#FFFFFF',
        elements: elL
      },
      back: {
        background: '#FFFFFF',
        elements: elR
      }
    })

    innerPageNum += 2
  }

  return spreadsList
}
