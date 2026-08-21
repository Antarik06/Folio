/**
 * An unexposed plate — a frame with no photograph in it yet.
 *
 * The landing page ships with no photography at all. Rather than filling the
 * gaps with stock, every frame is left empty and treated as the motif: a sheet
 * of blank plates waiting to be exposed. It reads as intentional, and when real
 * photographs arrive each of these becomes an <img> with no layout change,
 * because the aspect ratio is already reserved.
 *
 * To fill one later: pass `src`, and the plate renders the image instead.
 */
export function Plate({
  ratio = '1/1',
  className,
  mark = false,
  src,
  alt = '',
  tone = 'paper',
  bare = false,
}: {
  /** CSS aspect-ratio. The space is reserved whether or not there's an image. */
  ratio?: string
  className?: string
  /** Show the registration mark at centre. Use on large plates only. */
  mark?: boolean
  src?: string
  alt?: string
  /** `dark` sits on the ink stage; `paper` on the light ground. */
  tone?: 'paper' | 'dark'
  /** Drop the hairline — for plates already framed by their container. */
  bare?: boolean
}) {
  return (
    <div
      className={`relative overflow-hidden ${
        tone === 'dark' ? 'bg-[#F5F0E8]/[0.045]' : 'bg-surface-2'
      } ${
        bare
          ? ''
          : tone === 'dark'
            ? 'ring-1 ring-inset ring-[#F5F0E8]/10'
            : 'ring-1 ring-inset ring-border'
      } ${className ?? ''}`}
      style={{ aspectRatio: ratio }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      ) : mark ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg
            width="18"
            height="18"
            viewBox="0 0 14 14"
            aria-hidden="true"
            className={tone === 'dark' ? 'opacity-25' : 'opacity-20'}
          >
            <circle
              cx="7"
              cy="7"
              r="5"
              fill="none"
              stroke={tone === 'dark' ? '#F5F0E8' : 'var(--ink-soft)'}
              strokeWidth="0.9"
            />
            <path
              d="M7 0V14M0 7H14"
              stroke={tone === 'dark' ? '#F5F0E8' : 'var(--ink-soft)'}
              strokeWidth="0.7"
            />
          </svg>
        </span>
      ) : null}
    </div>
  )
}
