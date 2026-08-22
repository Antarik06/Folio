import { redirect } from 'next/navigation'
import { serverFetch } from '@/lib/api-client'
import { getAuthToken } from '@/lib/actions/auth'
import {
  ProfilePageClient,
  type ProfilePageData,
} from '@/components/profile/profile-page-client'
import type { Catalog } from '@/lib/cards/types'

export const metadata = {
  title: 'Profile — Folio',
}

/**
 * The catalogue and the library are fetched alongside the page because the
 * first-run questionnaire needs both — it previews the card live as the
 * answers arrive, and offers the user's own frames to put in it. Both are
 * tolerated as failures: a questionnaire with no templates to preview is
 * degraded, but a profile that will not load at all is broken.
 */
export default async function ProfilePage() {
  const token = await getAuthToken()
  if (!token) redirect('/auth/login')

  const [pageResult, catalogResult, libraryResult] = await Promise.allSettled([
    serverFetch('/api/profile/page', token),
    serverFetch('/api/cards/catalog', token),
    serverFetch('/api/profile/photos/library?limit=48', token),
  ])

  if (pageResult.status === 'rejected') {
    console.error('[Profile] Failed to load page:', pageResult.reason)
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-primary">
          Could not load your page
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The profile service did not answer. Try again in a moment.
        </p>
      </div>
    )
  }

  return <ProfilePageClient initial={page} />
}
