import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthToken } from '@/lib/actions/auth'
import { serverFetch } from '@/lib/api-client'
import {
  TEMPLATES_BY_STYLE,
  styleForCategory,
  type MagazineTemplate,
} from '@/lib/magazine-templates'
import { CreateWorkbench } from '@/components/create/create-workbench'

export const metadata = {
  title: 'Create — Folio',
  description:
    'Your albums, five shapes to pour photographs into, and the darkroom for a single frame.',
}

/**
 * The Create tab.
 *
 * Four sections: albums you have made, the template catalogue, the Photo
 * Studio, and the prints that came out of it. Each of the four loads
 * independently — a failure fetching prints should cost you the prints
 * section, not the page.
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

  const [published, albums, library, prints] = await Promise.all([
    load<any[]>('/api/albums/published', token, [], 'artist-published templates'),
    load<any[]>('/api/albums', token, [], 'albums'),
    load<{ total: number; photos: any[] }>(
      '/api/library/photos?limit=24',
      token,
      { total: 0, photos: [] },
      'library photos'
    ),
    load<{ total: number; photos: any[] }>(
      '/api/library/prints?limit=20',
      token,
      { total: 0, photos: [] },
      'studio prints'
    ),
  ])

  // Fold artist templates into whichever style their category matches, so one
  // more artist never means one more top-level section.
  const groups = TEMPLATES_BY_STYLE.map((g) => ({ ...g, templates: [...g.templates] }))

  for (const album of published) {
    const spreads = Array.isArray(album.layout_data?.spreads) ? album.layout_data.spreads : []
    // A template with no spreads has nothing to preview or apply.
    if (spreads.length === 0) continue

    // Never drop published work: an unrecognised category resolves to a style
    // rather than disappearing from the catalogue.
    const style = styleForCategory(album.category)
    const target = groups.find((g) => g.style.id === style.id)
    if (!target) continue

    const artistTemplate: MagazineTemplate = {
      id: album.id,
      name: album.title,
      description: album.description || 'An original layout published by a Folio artist.',
      thumbnail: '',
      category: style.name,
      productType: 'magazine',
      spreads,
      isDynamic: true,
      pageCount: album.page_count || spreads.length * 2,
    }
    target.templates.push(artistTemplate)
  }

  return (
    <CreateWorkbench
      groups={groups}
      eventId={eventId}
      albums={(albums ?? []).map((album: any) => ({
        id: album.id,
        title: album.title,
        description: album.description,
        status: album.status,
        is_published: album.is_published,
        event_id: album.event_id,
        event_title: album.event_title,
        cover_image_url: album.cover_image_url,
        preview_images: Array.isArray(album.preview_images) ? album.preview_images : [],
        spread_count: Number(album.spread_count) || 0,
        created_at: album.created_at,
        updated_at: album.updated_at,
      }))}
      studioPhotos={(library.photos ?? []).map((p: any) => ({
        id: p.id,
        url: p.url,
        event_title: p.event_title,
      }))}
      studioTotal={library.total ?? 0}
      prints={(prints.photos ?? []).map((p: any) => ({
        id: p.id,
        url: p.url,
        event_title: p.event_title,
        created_at: p.created_at,
        width: p.width,
        height: p.height,
      }))}
      printsTotal={prints.total ?? 0}
    />
  )
}

/** One failing section should never take the page down with it. */
async function load<T>(path: string, token: string | null, fallback: T, label: string): Promise<T> {
  try {
    const result = await serverFetch(path, token)
    return (result ?? fallback) as T
  } catch (err) {
    console.error(`[Create] Failed to load ${label}:`, err)
    return fallback
  }
}
