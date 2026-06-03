import { notFound } from 'next/navigation'
import { AlbumElement, AlbumSpread } from '@/components/album-editor/types'
import { FlipBook } from '@/components/flipbook/FlipBook'
import { FlipbookPageData } from '@/components/flipbook/types'
import { verifyAlbumShareToken } from '@/lib/album-share-token'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function normalizeSpreads(raw: unknown): AlbumSpread[] {
  if (!Array.isArray(raw)) return []

  return raw
    .map((spread, index) => {
      const s = spread as Partial<AlbumSpread>
      const front = s.front ?? {
        background: s.background || '#ffffff',
        elements: Array.isArray(s.elements) ? (s.elements as AlbumElement[]) : [],
      }
      const back = s.back ?? {
        background: '#ffffff',
        elements: [],
      }

      return {
        id: s.id || `spread-${index + 1}`,
        isCover: s.isCover ?? false,
        background: front.background || '#ffffff',
        elements: Array.isArray(front.elements) ? (front.elements as AlbumElement[]) : [],
        front: {
          background: front.background || '#ffffff',
          elements: Array.isArray(front.elements) ? (front.elements as AlbumElement[]) : [],
        },
        back: {
          background: back.background || '#ffffff',
          elements: Array.isArray(back.elements) ? (back.elements as AlbumElement[]) : [],
        },
      }
    })
    .filter((spread) => Boolean(spread.id))
}

function mapSpreadsToPages(spreads: AlbumSpread[]): FlipbookPageData[] {
  const pages: FlipbookPageData[] = []

  // Ensure covers are at the front, while maintaining the canvas-defined relative order for all other spreads
  const covers = spreads.filter(s => s.isCover)
  const nonCovers = spreads.filter(s => !s.isCover)
  const orderedSpreads = [...covers, ...nonCovers]

  const normalizePageElements = (elements: AlbumElement[], side: 'front' | 'back') =>
    elements.map((el) => ({
      ...el,
      id: `${el.id}-${side}`,
    }))

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
      if (back.elements.length > 0 || back.background !== '#ffffff') {
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

import { serverFetch } from '@/lib/api-client'

export default async function SharedAlbumPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  let sharedData: any = null
  try {
    sharedData = await serverFetch(`/api/albums/share/info/${token}`, null)
  } catch (err) {
    console.error('Error fetching shared album:', err)
    notFound()
  }

  if (!sharedData || !sharedData.album) {
    notFound()
  }

  const { album, protections } = sharedData

  const rawLayout = album.layout_data ?? album.theme_config ?? null
  const spreads = normalizeSpreads(rawLayout?.spreads)
  const pages = mapSpreadsToPages(spreads)
  const hasCover = spreads.some(s => s.isCover)

  return (
    <main className="dark min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-[1240px]">
        <FlipBook
          title={album.title || 'Shared Album'}
          pages={pages}
          protections={protections}
          hasCover={hasCover}
        />
      </div>
    </main>
  )
}
