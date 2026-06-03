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

  const orderedSpreads = [...spreads].sort((a, b) => {
    if (a.isCover === b.isCover) return 0
    return a.isCover ? -1 : 1
  })

  const normalizePageElements = (elements: AlbumElement[], side: 'front' | 'back') =>
    elements.map((el) => ({
      ...el,
      id: `${el.id}-${side}`,
    }))

  orderedSpreads.forEach((spread, spreadIndex) => {
    const isFirst = spreadIndex === 0
    const isLast = spreadIndex === orderedSpreads.length - 1
    
    const front = spread.front ?? { background: spread.background, elements: spread.elements }
    const back = spread.back ?? { background: '#ffffff', elements: [] }

    if (isFirst && spread.isCover) {
      // Just the cover page
      pages.push({
        id: `${spread.id}-front-${spreadIndex}`,
        background: front.background || '#ffffff',
        elements: normalizePageElements(front.elements, 'front'),
      })
    } else if (isLast && orderedSpreads.length > 1) {
      // Just the back cover
      // If the spread has content in 'back', use that as back cover, 
      // otherwise use 'front' if it's the only thing there.
      // Typically back cover is the last page.
      const backCover = back.elements.length > 0 ? back : front
      pages.push({
        id: `${spread.id}-back-${spreadIndex}`,
        background: backCover.background || '#ffffff',
        elements: normalizePageElements(backCover.elements, 'back'),
      })
    } else {
      // Regular spread - both pages
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

  if (pages.length === 0) {
    pages.push({ id: 'fallback-front', background: '#ffffff', elements: [] })
    pages.push({ id: 'fallback-back', background: '#ffffff', elements: [] })
  }

  return pages
}

export default async function SharedAlbumPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const payload = verifyAlbumShareToken(token)

  if (!payload) {
    notFound()
  }

  const adminClient = createAdminClient()
  const supabase = adminClient || (await createClient())

  const { data: album, error } = await supabase
    .from('albums')
    .select('*')
    .eq('id', payload.albumId)
    .single()

  if (error || !album) {
    notFound()
  }

  const rawLayout = (album as any).layout_data ?? (album as any).theme_config ?? null
  const spreads = normalizeSpreads(rawLayout?.spreads)
  const pages = mapSpreadsToPages(spreads)
  const hasCover = spreads.some(s => s.isCover)

  return (
    <main className="dark min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-[1240px]">
        <FlipBook
          title={album.title || 'Shared Album'}
          pages={pages}
          protections={payload.protections}
          hasCover={hasCover}
        />
      </div>
    </main>
  )
}
