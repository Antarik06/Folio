import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthToken } from '@/lib/actions/auth'
import { serverFetch } from '@/lib/api-client'
import { TEMPLATES_BY_STYLE, type MagazineTemplate } from '@/lib/magazine-templates'
import { StylesGallery } from '@/components/create/styles-gallery'

export const metadata = {
  title: 'Create — Folio',
  description:
    'Turn your photos into an album — five styles, or hand the whole thing to an artist.',
}

/**
 * The Create tab.
 *
 * Five styles, each with its templates. Artist-published templates join the
 * style their category names, so the catalogue stays five sections however many
 * artists contribute.
 */
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

  let published: any[] = []
  try {
    published = await serverFetch('/api/albums/published', token)
  } catch (err) {
    console.error('[Create] Failed to load artist-published templates:', err)
  }

  // Fold artist templates into whichever style their category matches, so one
  // more artist never means one more top-level section.
  const groups = TEMPLATES_BY_STYLE.map((g) => ({ ...g, templates: [...g.templates] }))

  for (const album of published) {
    const category = String(album.category ?? '').toLowerCase()
    const target =
      groups.find((g) => g.style.id === category) ??
      groups.find((g) => g.style.name.toLowerCase() === category)
    if (!target) continue

    const spreads = Array.isArray(album.layout_data?.spreads) ? album.layout_data.spreads : []
    if (spreads.length === 0) continue

    const artistTemplate: MagazineTemplate = {
      id: album.id,
      name: album.title,
      description: album.description || 'An original layout published by a Folio artist.',
      thumbnail: '',
      category: target.style.name,
      productType: 'magazine',
      spreads,
      isDynamic: true,
      pageCount: album.page_count || spreads.length * 2,
    }
    target.templates.push(artistTemplate)
  }

  return <StylesGallery groups={groups} eventId={eventId} />
}
