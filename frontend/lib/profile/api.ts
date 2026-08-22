import { clientFetch } from '@/lib/api-client'
import type { Card } from '@/lib/cards/types'

/**
 * The profile page's client.
 *
 * Cards have their own client in `lib/cards/api.ts` and keep it — this one
 * covers the page around the card: who you are, what you promoted onto it, and
 * the questionnaire that builds the first one.
 */

export interface ProfileAlbum {
  id: string
  title: string
  cover_url: string | null
  event_title: string | null
  on_profile: boolean
}

export interface ProfilePhoto {
  id: string
  url: string
  event_title: string | null
  taken_at: string | null
  on_profile: boolean
}

/** Everything the questionnaire can collect. Every field is skippable. */
export interface OnboardingAnswers {
  name?: string
  handle?: string
  tagline?: string
  occupation?: string
  location?: string
  bio?: string
  quote?: string
  interests?: string[]
  photoUrl?: string
  templateId?: string
  styleId?: string
}

export const profileApi = {
  /** Promote or withdraw one album. */
  setAlbum(albumId: string, onProfile: boolean) {
    return clientFetch(`/api/profile/albums/${albumId}`, {
      method: 'PATCH',
      body: JSON.stringify({ on_profile: onProfile }),
    })
  },

  /** Promote or withdraw one photograph. Own uploads only, enforced server-side. */
  setPhoto(photoId: string, onProfile: boolean) {
    return clientFetch(`/api/profile/photos/${photoId}`, {
      method: 'PATCH',
      body: JSON.stringify({ on_profile: onProfile }),
    })
  },

  /** The picker's contents — paginated, because a library can be enormous. */
  library(options: { limit?: number; offset?: number } = {}): Promise<{
    total: number
    photos: ProfilePhoto[]
  }> {
    const params = new URLSearchParams({
      limit: String(options.limit ?? 60),
      offset: String(options.offset ?? 0),
    })
    return clientFetch(`/api/profile/photos/library?${params}`)
  },

  updatePage(input: { handle?: string; bio?: string; page_is_public?: boolean }) {
    return clientFetch('/api/profile/page', {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
  },

  /** Answers in, a finished card out. */
  onboard(answers: OnboardingAnswers): Promise<{ page: unknown; card: Card }> {
    return clientFetch('/api/profile/onboarding', {
      method: 'POST',
      body: JSON.stringify(answers),
    })
  },

  skipOnboarding(): Promise<{ onboarded: boolean }> {
    return clientFetch('/api/profile/onboarding/skip', { method: 'POST' })
  },
}
