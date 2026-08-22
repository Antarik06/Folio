import { redirect } from 'next/navigation'
import { serverFetch } from '@/lib/api-client'
import { getAuthToken } from '@/lib/actions/auth'
import { PhotoStudio } from '@/components/create/photo-studio'

export const metadata = {
  title: 'Photo Studio — Folio',
  description: 'Grade a single photograph — film stocks, exposure, and crop.',
}

/**
 * The Photo Studio: the darkroom of the Create tab.
 *
 * Deliberately its own route rather than a panel inside the album editor. One
 * tool lays out a book, the other grades a single photograph, and each gets a
 * room that looks like what it does. Create's Photo Studio section links
 * straight here with `?photo=` so the common case — "grade this one" — skips
 * the picker entirely.
 */
export default async function PhotoStudioPage({
  searchParams,
}: {
  searchParams: Promise<{ photo?: string }>
}) {
  const token = await getAuthToken()
  if (!token) redirect('/auth/login')

  const { photo: initialPhotoId } = (await searchParams) || {}

  let library: { total: number; photos: any[] } = { total: 0, photos: [] }
  try {
    library = await serverFetch('/api/library/photos?limit=96', token)
  } catch (err) {
    console.error('[Photo Studio] Library fetch failed:', err)
  }

  return (
    <PhotoStudio
      initialPhotoId={initialPhotoId}
      photos={(library.photos ?? []).map((p: any) => ({
        id: p.id,
        url: p.url,
        event_id: p.event_id,
        event_title: p.event_title,
      }))}
    />
  )
}
