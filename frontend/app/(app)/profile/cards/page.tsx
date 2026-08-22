import { redirect } from 'next/navigation'
import { serverFetch } from '@/lib/api-client'
import { getAuthToken } from '@/lib/actions/auth'
import { CardsClient } from '@/components/profile/cards-client'
import { EMPTY_PROFILE, type CardBundle, type Catalog } from '@/lib/cards/types'

export const metadata = {
  title: 'Cards — Folio',
}

/**
 * The catalogue is fetched here rather than compiled in: templates and styles
 * are backend data, so publishing a new one puts it on this screen with nothing
 * deployed.
 */
export default async function CardsPage() {
  const token = await getAuthToken()
  if (!token) redirect('/auth/login')

  const [bundleResult, catalogResult, profileResult] = await Promise.allSettled([
    serverFetch('/api/cards', token),
    serverFetch('/api/cards/catalog', token),
    serverFetch('/api/cards/profile', token),
  ])

  if (bundleResult.status === 'rejected' || catalogResult.status === 'rejected') {
    console.error(
      '[Cards] Failed to load:',
      bundleResult.status === 'rejected' ? bundleResult.reason : catalogResult
    )
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-primary">
          Could not load your cards
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The card service did not answer. Try again in a moment.
        </p>
      </div>
    )
  }

  const bundle = bundleResult.value as CardBundle
  const catalog = catalogResult.value as Catalog
  const profile = profileResult.status === 'fulfilled' ? profileResult.value : EMPTY_PROFILE

  return <CardsClient initial={bundle} catalog={catalog} profile={profile} />
}
