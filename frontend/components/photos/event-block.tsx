import Link from 'next/link'
import { ContributorStack, MonoLabel } from '@/components/folio/primitives'
import { ClusterRow } from '@/components/photos/contact-sheet'
import {
  clusterByCaptureTime,
  monoCount,
  monoDate,
  monoMeta,
  type ClusterablePhoto,
} from '@/lib/photo-clusters'

export interface EventOverview {
  id: string
  title: string
  event_date: string | null
  location: string | null
  photos_count: number
  guests_count: number
  is_host: boolean
  photos: ClusterablePhoto[]
  contributors: { id: string; name: string | null }[]
}

/**
 * An Event as the design frames it: a titled cover strip, loose capture-time
 * clusters, an asymmetric first row, and contributor initials stamped where
 * more than one person contributed frames.
 *
 * Nothing here says "shared" in words — the provenance line and the broken
 * grid rhythm carry that on their own.
 */
export function EventBlock({ event }: { event: EventOverview }) {
  const clusters = clusterByCaptureTime(event.photos, { maxClusters: 2, maxPerCluster: 5 })

  const shareLine = event.is_host
    ? event.guests_count > 0
      ? `Event — shared with ${monoCount(event.guests_count)} guest${event.guests_count === 1 ? '' : 's'}`
      : 'Event — just you'
    : 'Event — you joined'

  const metaLine = monoMeta(
    monoDate(event.event_date),
    event.location,
    `${monoCount(event.photos_count)} frames`
  )

  return (
    <section>
      <MonoLabel tone="secondary" className="mb-2">
        {shareLine}
      </MonoLabel>

      <div className="rounded-[4px] border border-border bg-card p-4 sm:p-5">
        {/* Cover strip */}
        <div className="mb-4 flex items-start justify-between gap-4 border-b border-border pb-3.5">
          <div className="min-w-0">
            <Link
              href={`/photos/events/${event.id}`}
              className="font-serif text-lg italic leading-snug text-foreground underline-offset-4 hover:underline sm:text-2xl"
            >
              {event.title}
            </Link>
            {metaLine ? <MonoLabel className="mt-1">{metaLine}</MonoLabel> : null}
          </div>
          {event.contributors.length > 1 ? (
            <ContributorStack people={event.contributors} max={3} className="shrink-0" />
          ) : null}
        </div>

        {clusters.length === 0 ? (
          <div className="flex flex-col items-center gap-3 border border-dashed border-border px-4 py-10 text-center">
            <MonoLabel>No frames yet</MonoLabel>
            <Link
              href={`/photos/events/${event.id}`}
              className="font-mono text-[11px] uppercase tracking-[0.06em] text-primary underline-offset-4 hover:underline"
            >
              Add photos →
            </Link>
          </div>
        ) : (
          clusters.map((cluster, i) => (
            <div key={cluster.startedAt} className={i > 0 ? 'mt-5' : undefined}>
              <MonoLabel size="xs" className="mb-1.5">
                {cluster.label}
              </MonoLabel>
              <ClusterRow
                photos={cluster.photos}
                variant={i === 0 ? 'triptych' : 'uniform'}
              />
            </div>
          ))
        )}
      </div>
    </section>
  )
}
