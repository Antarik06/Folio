import { createClient } from '@/lib/supabase/server'
import { ALL_MAGAZINE_TEMPLATES } from '@/lib/magazine-templates'
import { redirect } from 'next/navigation'
import { TemplatesShowcase } from '@/components/templates/templates-showcase'
import { serverFetch } from '@/lib/api-client'
import { cookies } from 'next/headers'

export const metadata = {
  title: 'Popular Albums | Folio',
  description: 'Select an artist-crafted popular album layout to organize your collective event photos.',
}

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<{ eventId?: string }> }) {
  const { eventId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const cookieStore = await cookies()
  const isAdmin = cookieStore.get('admin_session')?.value === 'admin-secret-token'
  const isArtist = cookieStore.get('artist_session')?.value === 'artist-secret-token'

  if (!user && !isAdmin && !isArtist) {
    redirect('/auth/login')
  }

  let token: string | null = null
  if (isAdmin) {
    token = 'admin-secret-token'
  } else if (isArtist) {
    token = 'artist-secret-token'
  } else {
    const { data: { session } } = await supabase.auth.getSession()
    token = session?.access_token || null
  }

  let publishedTemplates: any[] = []
  try {
    publishedTemplates = await serverFetch('/api/albums/published', token)
  } catch (err) {
    console.error('Failed to load published templates:', err)
  }

  const dynamicTemplates = publishedTemplates.map(album => ({
    id: album.id,
    name: album.title,
    description: album.description || 'Curated design template created by an independent artist.',
    thumbnail: album.cover_photo_url || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop',
    category: 'Artist',
    productType: 'magazine',
    spreads: album.layout_data?.spreads || []
  }))

  const allTemplates = [...ALL_MAGAZINE_TEMPLATES, ...dynamicTemplates]

  return <TemplatesShowcase templates={allTemplates} eventId={eventId} />
}
