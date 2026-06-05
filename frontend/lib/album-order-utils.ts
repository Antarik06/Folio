import type { AlbumSpread, AlbumElement } from '@/components/album-editor/types'
import type { FlipbookPageData } from '@/components/flipbook/types'

export function spreadsToFlipbookPages(spreads: AlbumSpread[]): FlipbookPageData[] {
  const pages: FlipbookPageData[] = []

  // Ensure covers are at the front, while maintaining the canvas-defined relative order for all other spreads
  const covers = spreads.filter(s => s.isCover)
  const nonCovers = spreads.filter(s => !s.isCover)
  const orderedSpreads = [...covers, ...nonCovers]

  const normalizePageElements = (elements: AlbumElement[] | undefined, side: 'front' | 'back') => {
    if (!elements) return []
    return elements.map((el) => ({
      ...el,
      id: `${el.id}-${side}`,
    }))
  }

  orderedSpreads.forEach((spread, spreadIndex) => {
    const front = spread.front ?? { background: spread.background, elements: spread.elements }
    const back = spread.back ?? { background: '#ffffff', elements: [] }

    if (spread.isCover) {
      // Pushing the cover front page (standalone right side)
      pages.push({
        id: `${spread.id}-front-${spreadIndex}`,
        background: front.background || '#ffffff',
        elements: normalizePageElements(front.elements, 'front'),
      })

      // If the cover spread has elements on the back side, push it as the inside cover (Page 2, left side)
      if ((back.elements && back.elements.length > 0) || back.background !== '#ffffff') {
        pages.push({
          id: `${spread.id}-back-${spreadIndex}`,
          background: back.background || '#ffffff',
          elements: normalizePageElements(back.elements, 'back'),
        })
      }
    } else {
      // For all regular spreads, push both front and back pages in sequence
      pages.push({
        id: `${spread.id}-front-${spreadIndex}`,
        background: front.background || '#ffffff',
        elements: normalizePageElements(front.elements, 'front'),
      })

      pages.push({
        id: `${spread.id}-back-${spreadIndex}`,
        background: back.background || '#ffffff',
        elements: normalizePageElements(back.elements, 'back'),
      })
    }
  })

  // To make sure the flipbook opens and closes correctly (even page count is best for double-page spreads),
  // we append a blank page if the total page count is odd.
  if (pages.length > 0 && pages.length % 2 !== 0) {
    pages.push({
      id: 'final-blank-back-cover',
      background: '#ffffff',
      elements: [],
    })
  }

  if (pages.length === 0) {
    pages.push({ id: 'fallback-front', background: '#ffffff', elements: [] })
    pages.push({ id: 'fallback-back', background: '#ffffff', elements: [] })
  }

  return pages
}
