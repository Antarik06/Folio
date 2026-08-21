import { redirect } from 'next/navigation'
import { serverFetch } from '@/lib/api-client'
import { getAuthToken } from '@/lib/actions/auth'
import {
  ProfilePageClient,
  type ProfilePageData,
} from '@/components/profile/profile-page-client'

export const metadata = {
  title: 'Profile — Folio',
}

export default async function ProfilePage() {
  const token = await getAuthToken()
  if (!token) redirect('/auth/login')

  let page: ProfilePageData
  try {
    page = await serverFetch('/api/profile/page', token)
  } catch (err) {
    console.error('[Profile] Failed to load page:', err)
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
