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
