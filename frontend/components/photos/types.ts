import type { ClusterablePhoto } from '@/lib/photo-clusters'

/**
 * A collection as the Photos tab reads it.
 *
 * `kind` is computed server-side in libraryService, not stored: a collection
 * with nobody else in it is a space, and becomes an event the moment someone
 * joins. Shared-ness is a property of the collection, not a separate type.
 */
export interface EventOverview {
  id: string
  title: string
  event_date: string | null
  location: string | null
  photos_count: number
  guests_count: number
  is_host: boolean
  kind: 'event' | 'space'
  photos: ClusterablePhoto[]
  contributors: { id: string; name: string | null }[]
}
