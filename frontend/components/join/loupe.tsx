'use client'

/**
 * Screen 02, cards 2 and 3 — the loupe, and the sleeve.
 *
 * Face-matching is presented as an optical instrument closing in, not a
 * spinner: a circular selfie ringed by a pulsing terracotta border, with a mono
 * readout ticking a frame count. The reveal then slides matches in staggered
 * and rotated, the way prints drop into a sleeve.
 *
 * Both blocks sit on a dark ground regardless of the global theme, because a
 * darkroom is where this actually happens.
 */

export function Loupe({
  src,
  caption,
  readout,
}: {
  src: string | null
  /** The small mono line above the loupe. */
  caption: string
  /** The terracotta readout beneath, e.g. "Matching… 812 frames". */
  readout: string
}) {
  return (
    <div className="rounded-[4px] border-[1.5px] border-border bg-foreground px-5 py-7 text-center">
      <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.1em] text-[#F5F0E8] opacity-50">
        {caption}
      </div>

      <div className="animate-loupe-pulse mx-auto h-[160px] w-[160px] overflow-hidden rounded-full border-[3px] border-primary sm:h-[180px] sm:w-[180px]">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-[#F5F0E8]/10" />
        )}
      </div>

      <div
        className="mt-5 font-mono text-[12px] uppercase tracking-[0.08em] text-primary"
        role="status"
        aria-live="polite"
      >
        {readout}
      </div>
    </div>
  )
}

export interface RevealPhoto {
  id: string
  url: string
}

/**
 * The match reveal. Rows step in width and indent so the stack reads as prints
 * sliding into a sleeve rather than a list — each with a staggered entrance.
 */
export function SleeveReveal({
  photos,
  headline,
  caption,
}: {
  photos: RevealPhoto[]
  headline: string
  caption: string
}) {
  return (
    <div className="overflow-hidden rounded-[4px] border-[1.5px] border-border bg-card px-5 py-7">
      <h2 className="text-center font-serif text-[clamp(1.25rem,5vw,1.5rem)] text-foreground">
        {headline}
      </h2>
      <div className="mt-1.5 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
        {caption}
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {photos.slice(0, 3).map((photo, i) => (
          <div
            key={photo.id}
            className="animate-slide-sleeve h-[92px] overflow-hidden bg-surface-2 sm:h-[110px]"
            style={{
              width: `${100 - i * 8}%`,
              marginLeft: `${i * 8}%`,
              animationDelay: `${i * 0.1}s`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
