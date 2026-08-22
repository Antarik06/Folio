import Link from 'next/link'
import { FILM_STOCKS } from '@/lib/photo-filters'

export interface StudioSectionPhoto {
  id: string
  url: string
  event_title?: string | null
}

/**
 * Photo Studio, as a room on the Create page rather than a button in a corner.
 *
 * The section *is* the door: the strip of frames below the copy goes straight
 * into the darkroom with that photograph already on the easel, so the common
 * case — "grade this one" — takes one tap instead of three.
 */
export function StudioSection({
  photos,
  total,
}: {
  photos: StudioSectionPhoto[]
  total: number
}) {
  return (
    <div className="overflow-hidden rounded-[4px] bg-[#0E0C0A]">
      <div className="grid gap-y-8 p-6 sm:p-9 lg:grid-cols-[minmax(0,1fr)_1.1fr] lg:gap-x-12">
        {/* ── The pitch ─────────────────────────────────────────────── */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
              The darkroom
            </div>
            <h3 className="mt-3 font-serif text-[clamp(1.7rem,4.5vw,2.5rem)] leading-[1.02] text-[#F5F0E8]">
              Grade one photograph
            </h3>
            <p className="mt-3 max-w-[42ch] text-[13.5px] leading-relaxed text-[#F5F0E8]/55">
              Nine film stocks, exposure and contrast, warmth, fade, vignette,
              rotation and flip. The negative stays untouched — every grade is
              saved as a new print.
            </p>

            <div className="mt-6 flex gap-1.5">
              {FILM_STOCKS.slice(1, 8).map((stock) => (
                <span
                  key={stock.name}
                  title={stock.name}
                  className="h-8 flex-1 rounded-[1px]"
                  style={{ background: stock.swatch }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-[0.08em] text-[#F5F0E8]/30">
              <span>{FILM_STOCKS.length} stocks</span>
              <span>Non-destructive</span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/create/photo"
              className="inline-flex min-h-[46px] items-center rounded-[2px] bg-primary px-6 font-mono text-[11px] uppercase tracking-[0.12em] text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Open the studio
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#F5F0E8]/35">
              {total} frame{total === 1 ? '' : 's'} on the shelf
            </span>
          </div>
        </div>

        {/* ── Straight to a frame ───────────────────────────────────── */}
        <div>
          <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#F5F0E8]/40">
            {photos.length > 0 ? 'Tap a frame to start grading' : 'Nothing to print yet'}
          </div>

          {photos.length === 0 ? (
            <div className="flex h-full min-h-[180px] flex-col items-center justify-center border border-dashed border-[#F5F0E8]/15 px-6 py-10 text-center">
              <p className="max-w-[34ch] text-[13px] leading-relaxed text-[#F5F0E8]/50">
                Photographs from your events and spaces appear here, ready to
                grade.
              </p>
              <Link
                href="/photos"
                className="mt-5 inline-flex min-h-[42px] items-center rounded-[2px] border border-[#F5F0E8]/25 px-5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#F5F0E8]/75 transition-colors hover:border-[#F5F0E8]/60 hover:text-[#F5F0E8]"
              >
                Go to Photos
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-px bg-[#F5F0E8]/10 sm:grid-cols-6">
              {photos.map((photo) => (
                <Link
                  key={photo.id}
                  href={`/create/photo?photo=${photo.id}`}
                  title={photo.event_title || 'Grade this frame'}
                  className="group relative aspect-square overflow-hidden bg-[#14110E]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover opacity-75 transition-opacity group-hover:opacity-100"
                  />
                  <span className="pointer-events-none absolute inset-0 opacity-0 ring-2 ring-inset ring-primary transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
