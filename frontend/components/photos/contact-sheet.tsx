import Link from 'next/link'
import { Frame, MonoLabel } from '@/components/folio/primitives'
import type { ClusterablePhoto } from '@/lib/photo-clusters'

interface SheetPhoto extends ClusterablePhoto {
  event_id?: string
  event_title?: string
}

/**
 * The Library grid: one unbroken contact sheet. Uniform crops, 2px gutters, no
 * captions, sorted by capture date — deliberately the plainest surface in the
 * app, so an Event's broken rhythm reads as different without needing a badge.
 *
 * The density steps down on narrow screens (8 → 6 → 4 columns) rather than
 * reflowing into cards: a contact sheet with four frames across is still a
 * contact sheet, a stack of captioned cards is not.
 */
export function ContactSheet({
  photos,
  emptyHint,
}: {
  photos: SheetPhoto[]
  emptyHint?: React.ReactNode
}) {
  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[4px] border border-dashed border-border bg-card px-6 py-14 text-center">
        <MonoLabel>Sheet is empty</MonoLabel>
        {emptyHint}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[4px] border border-border bg-card">
      <div className="grid grid-cols-4 gap-[2px] p-[2px] sm:grid-cols-6 lg:grid-cols-8">
        {photos.map((photo) =>
          photo.event_id ? (
            <Link
              key={photo.id}
              href={`/photos/events/${photo.event_id}`}
              aria-label={photo.event_title ? `Open ${photo.event_title}` : 'Open event'}
              className="group relative block focus-visible:z-10"
            >
              <Frame src={photo.url} alt="" ratio="1/1" />
              <span className="pointer-events-none absolute inset-0 opacity-0 outline outline-2 -outline-offset-2 outline-primary transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
            </Link>
          ) : (
            <Frame key={photo.id} src={photo.url} alt="" ratio="1/1" />
          )
        )}
      </div>
    </div>
  )
}

/**
 * A single cluster row inside an Event. The first row of an event is an
 * asymmetric triptych — one uncropped wide frame beside two squares — and
 * every row after it is uniform. That asymmetry is what makes an Event look
 * like a laid-out page rather than a grid.
 */
export function ClusterRow({
  photos,
  variant,
}: {
  photos: ClusterablePhoto[]
  variant: 'triptych' | 'uniform'
}) {
  if (photos.length === 0) return null

  if (variant === 'triptych') {
    const [hero, ...rest] = photos
    const companions = rest.slice(0, 2)

    return (
      <div className="grid grid-cols-[2fr_1fr_1fr] gap-[3px]">
        <Frame
          src={hero.url}
          alt=""
          ratio="16/10"
          className="h-[110px] sm:h-[150px] lg:h-[180px]"
        />
        {companions.map((photo) => (
          <Frame
            key={photo.id}
            src={photo.url}
            alt=""
            ratio="1/1"
            className="h-[110px] sm:h-[150px] lg:h-[180px]"
          />
        ))}
        {/* Keep the triptych's shape even when the cluster is short. */}
        {Array.from({ length: Math.max(0, 2 - companions.length) }).map((_, i) => (
          <div
            key={`gap-${i}`}
            className="h-[110px] border border-dashed border-border sm:h-[150px] lg:h-[180px]"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-[3px] sm:grid-cols-4 lg:grid-cols-5">
      {photos.slice(0, 5).map((photo) => (
        <Frame key={photo.id} src={photo.url} alt="" ratio="1/1" />
      ))}
    </div>
  )
}
