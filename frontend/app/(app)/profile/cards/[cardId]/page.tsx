import { notFound, redirect } from 'next/navigation'
import { serverFetch } from '@/lib/api-client'
import { getAuthToken } from '@/lib/actions/auth'
import { CardEditor } from '@/components/cards/card-editor'
import { EMPTY_PROFILE, type Catalog } from '@/lib/cards/types'

export const metadata = {
  title: 'Editing a card — Folio',
}

/**
 * The editor's data is gathered server-side so the card is already on screen
 * when the page paints — the template definition, the base styles, the profile
 * behind it and the library to pick photographs from.
 */
export default async function CardEditorPage({
  params,
}: {
  params: Promise<{ cardId: string }>
}) {
  const token = await getAuthToken()
  if (!token) redirect('/auth/login')

  const { cardId } = await params

  const [cardResult, catalogResult, profileResult, libraryResult] = await Promise.allSettled([
    serverFetch(`/api/cards/${cardId}`, token),
    serverFetch('/api/cards/catalog', token),
    serverFetch('/api/cards/profile', token),
    serverFetch('/api/library/photos?limit=96', token),
  ])

  if (cardResult.status === 'rejected') {
    console.error('[Card editor] Card fetch failed:', cardResult.reason)
    notFound()
  }
  if (catalogResult.status === 'rejected') {
    console.error('[Card editor] Catalogue fetch failed:', catalogResult.reason)
    notFound()
  }

  const { card, templates, styles } = cardResult.value
  const catalog = catalogResult.value as Catalog
  const profile = profileResult.status === 'fulfilled' ? profileResult.value : EMPTY_PROFILE
  const library = libraryResult.status === 'fulfilled' ? libraryResult.value : { photos: [] }

  return (
    <CardEditor
      card={card}
      catalog={catalog}
      profile={profile}
      pinned={templates}
      styles={styles}
      photos={(library.photos ?? [])
        .filter((photo: any) => !!photo.url)
        .map((photo: any) => ({
          id: photo.id,
          url: photo.url,
          event_title: photo.event_title ?? null,
        }))}
    />
  )
}
