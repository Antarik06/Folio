import Link from 'next/link'

interface SheetPhoto {
  id: string
  url: string
  event_id?: string
  event_title?: string
}

/**
 * The Library — one full-bleed contact sheet.
 *
 * A contact sheet is uniform by definition: identical frames, no hierarchy,
 * scan the lot. Varying the tile sizes here would decorate away the only thing
 * the format means. So the impact comes from density and bleed instead — the
 * sheet runs the full width of the viewport with 1px gutters and up to fourteen
 * frames across, which reads as *everything you have* in a way a padded
 * six-column grid never does.
 *
 * Its restraint is also what makes the two sections above it work: the ribbon
 * is wide, the stacks have depth, and this is deliberately flat.
 */
export function LibrarySheet({ photos }: { photos: SheetPhoto[] }) {
  if (photos.length === 0) {
    return (
      <div className="py-14 text-center">
        <h3 className="font-serif text-2xl italic text-foreground">The sheet is blank</h3>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Frames land here from every event and space you have.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-6 gap-px bg-border sm:grid-cols-10 lg:grid-cols-14">
        {photos.map((photo) => {
          const frame = (
            <div className="relative aspect-square overflow-hidden bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <span className="absolute inset-0 bg-background/0 transition-colors duration-200 group-hover:bg-background/25" />
            </div>
          )

          return photo.event_id ? (
            <Link
              key={photo.id}
              href={`/photos/events/${photo.event_id}`}
              aria-label={photo.event_title ? `Open ${photo.event_title}` : 'Open event'}
              className="group relative block focus-visible:z-10"
            >
              {frame}
            </Link>
          ) : (
            <div key={photo.id} className="group relative block">
              {frame}
            </div>
          )
        })}
      </div>
    </div>
  )
}
