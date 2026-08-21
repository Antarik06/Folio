import { redirect } from 'next/navigation'
import { serverFetch } from '@/lib/api-client'
import { getAuthToken } from '@/lib/actions/auth'
import { PhotoStudio } from '@/components/create/photo-studio'

export const metadata = {
  title: 'Photo Studio — Folio',
  description: 'Grade a single photograph — film stocks, exposure, and crop.',
}

/**
 * The Photo Studio: the second of the two making tools in Create.
 *
 * Deliberately its own route rather than a panel inside the album editor. One
 * tool lays out a book, the other grades a single photograph, and each gets a
 * room that looks like what it does.
 */
export default async function PhotoStudioPage() {
  const token = await getAuthToken()
  if (!token) redirect('/auth/login')

  let library: { total: number; photos: any[] } = { total: 0, photos: [] }
  try {
    library = await serverFetch('/api/library/photos?limit=96', token)
  } catch (err) {
    console.error('[Photo Studio] Library fetch failed:', err)
  }

  return (
    <PhotoStudio
      photos={(library.photos ?? []).map((p: any) => ({
        id: p.id,
        url: p.url,
        event_id: p.event_id,
        event_title: p.event_title,
      }))}
    />
  )
}
