import { createClient } from '@/lib/supabase/server'
import { getAuthToken } from '@/lib/actions/auth'
import { ALL_MAGAZINE_TEMPLATES } from '@/lib/magazine-templates'
import { redirect } from 'next/navigation'
import { TemplatesShowcase } from '@/components/templates/templates-showcase'
import { serverFetch } from '@/lib/api-client'

export const metadata = {
  title: 'Popular Albums | Folio',
  description: 'Select an artist-crafted popular album layout to organize your collective event photos.',
}

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<{ eventId?: string }> }) {
  const { eventId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const token = await getAuthToken()

  let publishedTemplates: any[] = []
  try {
    publishedTemplates = await serverFetch('/api/albums/published', token)
  } catch (err) {
    console.error('Failed to load published templates:', err)
  }

  const CATEGORY_MAP: Record<string, string> = {
    wedding: 'Wedding',
    travel: 'Travel',
    fashion: 'Fashion',
    portfolio: 'Portfolio',
    luxury: 'Luxury',
    modern: 'Modern',
    birthday: 'Birthday',
    nostalgic: 'Nostalgic'
  }

  const dynamicTemplates = publishedTemplates.map(album => {
    const rawCategory = album.category || 'Artist'
    const showcaseCategory = CATEGORY_MAP[rawCategory.toLowerCase()] || rawCategory

    return {
      id: album.id,
      name: album.title,
      description: album.description || 'Curated design template created by an independent artist.',
      thumbnail: album.cover_photo_url || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop',
      category: showcaseCategory,
      productType: 'magazine' as const,
      spreads: album.layout_data?.spreads || [],
      layout_schema: album.layout_data?.pages ? album.layout_data : (album.layout_data?.layout_schema || null),
      isDynamic: true,
      page_previews_urls: album.page_previews_urls || album.layout_data?.page_previews_urls || [],
      pageCount: album.page_count || album.layout_data?.pages?.length || (Array.isArray(album.layout_data?.spreads) ? album.layout_data.spreads.length * 2 : 2)
    }
  })

  const allTemplates = [...ALL_MAGAZINE_TEMPLATES, ...dynamicTemplates]

  return <TemplatesShowcase templates={allTemplates} eventId={eventId} />
}
