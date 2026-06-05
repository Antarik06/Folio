import { notFound } from 'next/navigation'
import { AlbumElement, AlbumSpread } from '@/components/album-editor/types'
import { FlipBook } from '@/components/flipbook/FlipBook'
import { FlipbookPageData } from '@/components/flipbook/types'
import { verifyAlbumShareToken } from '@/lib/album-share-token'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAlbumAspectRatio } from '@/lib/template-engine-utils'
import { spreadsToFlipbookPages } from '@/lib/album-order-utils'

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
  const pages = spreadsToFlipbookPages(spreads)
  const hasCover = spreads.some(s => s.isCover)
  const aspectRatio = getAlbumAspectRatio(album)

  return (
    <main className="dark min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-[1240px]">
        <FlipBook
          title={album.title || 'Shared Album'}
          pages={pages}
          protections={protections}
          hasCover={hasCover}
          aspectRatio={aspectRatio}
        />
      </div>
    </main>
  )
}
