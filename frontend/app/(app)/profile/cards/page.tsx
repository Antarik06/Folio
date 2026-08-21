import { redirect } from 'next/navigation'
import { serverFetch } from '@/lib/api-client'
import { getAuthToken } from '@/lib/actions/auth'
import { CardsClient } from '@/components/profile/cards-client'

export const metadata = {
  title: 'Cards — Folio',
}

export default async function CardsPage() {
  const token = await getAuthToken()
  if (!token) redirect('/auth/login')

  const [profileResult, libraryResult] = await Promise.allSettled([
    serverFetch('/api/profile/page', token),
    serverFetch('/api/library/photos?limit=96', token),
  ])

  const profile =
    profileResult.status === 'fulfilled' ? profileResult.value : null
  const library =
    libraryResult.status === 'fulfilled'
      ? libraryResult.value
      : { total: 0, photos: [] }

  if (profileResult.status === 'rejected') {
    console.error('[Cards] Profile fetch failed:', profileResult.reason)
  }
  if (libraryResult.status === 'rejected') {
    console.error('[Cards] Library fetch failed:', libraryResult.reason)
  }

  return (
    <CardsClient
      initialCards={profile?.cards ?? []}
      photos={(library.photos ?? []).map((p: any) => ({
        id: p.id,
        url: p.url,
        event_title: p.event_title,
      }))}
      handle={profile?.handle ?? null}
      name={profile?.full_name ?? null}
    />
  )
}
