import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthToken } from '@/lib/actions/auth'
import { ALL_MAGAZINE_TEMPLATES } from '@/lib/magazine-templates'
import { serverFetch } from '@/lib/api-client'
import { StylesGallery } from '@/components/create/styles-gallery'
import type { StyleSummary } from '@/components/create/style-card'

export const metadata = {
  title: 'Create — Folio',
  description:
    'Turn your photos into an album, a print, or a card — build it yourself or ask an artist.',
}

const CATEGORY_MAP: Record<string, string> = {
  wedding: 'Wedding',
  travel: 'Travel',
  fashion: 'Fashion',
  portfolio: 'Portfolio',
  luxury: 'Luxury',
  modern: 'Modern',
  birthday: 'Birthday',
  nostalgic: 'Nostalgic',
}

const FALLBACK_THUMB =
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop'

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>
}) {
  const { eventId } = (await searchParams) || {}

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const token = await getAuthToken()

  let publishedTemplates: any[] = []
  try {
    publishedTemplates = await serverFetch('/api/albums/published', token)
  } catch (err) {
    console.error('[Create] Failed to load artist-published styles:', err)
  }

  const dynamicTemplates: StyleSummary[] = publishedTemplates.map((album: any) => {
    const rawCategory = album.category || 'Artist'
    return {
      id: album.id,
      name: album.title,
      category: CATEGORY_MAP[rawCategory.toLowerCase()] || rawCategory,
      thumbnail: album.cover_photo_url || FALLBACK_THUMB,
      isDynamic: true,
      pageCount:
        album.page_count ||
        album.layout_data?.pages?.length ||
        (Array.isArray(album.layout_data?.spreads)
          ? album.layout_data.spreads.length * 2
          : undefined),
    }
  })

  const staticTemplates: StyleSummary[] = ALL_MAGAZINE_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    thumbnail: t.thumbnail,
    pageCount: t.pageCount ?? (t.spreads?.length ? t.spreads.length * 2 : undefined),
  }))

  return (
    <StylesGallery
      templates={[...staticTemplates, ...dynamicTemplates]}
      eventId={eventId}
    />
  )
}
