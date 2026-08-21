/**
 * Press marks — the recurring ornament vocabulary of the Editorial Darkroom
 * language. These are the only decoration the app uses: they come from print
 * production (registration crosses, trim corners, sprocket holes) rather than
 * from generic UI iconography.
 *
 * Per docs/design/design_handoff_folio_redesign, the registration cross is the
 * single motif that repeats across the guest join card, the 3D preview stage,
 * and every occasion share card — so a Folio card reads as Folio's before the
 * wordmark is visible.
 */

interface MarkProps {
  size?: number
  className?: string
  /** Stroke colour. Defaults to the muted ink token. */
  color?: string
  opacity?: number
}

/**
 * Plus-in-circle. The primary Folio mark.
 */
export function RegistrationCross({
  size = 14,
  className,
  color = 'var(--ink-soft)',
  opacity = 1,
}: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      className={className}
      style={{ opacity }}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="7" cy="7" r="5" fill="none" stroke={color} strokeWidth="1" />
      <path d="M7 0V14M0 7H14" stroke={color} strokeWidth="0.8" />
    </svg>
  )
}

/**
 * Crosshair without the circle — used as the lighter corner mark on the join
 * card, where four circles would read as noise.
 */
export function CrosshairMark({
  size = 14,
  className,
  color = 'var(--ink-soft)',
  opacity = 1,
}: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      className={className}
      style={{ opacity }}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M7 0V5M7 9V14M0 7H5M9 7H14" stroke={color} strokeWidth="1" />
    </svg>
  )
}

type Corner = 'tl' | 'tr' | 'bl' | 'br'

/**
 * Trim corner — an L-bracket marking where the page would be cut. Used on the
 * two corners of the 3D preview stage that don't carry a registration cross.
 */
export function TrimCorner({
  size = 16,
  className,
  color = '#F5F0E8',
  opacity = 0.4,
  corner = 'tl',
}: MarkProps & { corner?: Corner }) {
  const paths: Record<Corner, string> = {
    tl: 'M2 2H8M2 2V8',
    tr: 'M14 2H8M14 2V8',
    bl: 'M2 14H8M2 14V8',
    br: 'M14 14H8M14 14V8',
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={className}
      style={{ opacity }}
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[corner]} stroke={color} strokeWidth="1" />
    </svg>
  )
}

/**
 * Full registration target — circle plus full-bleed crosshair. The press-proof
 * version used at the corners of the album preview stage.
 */
export function RegistrationTarget({
  size = 16,
  className,
  color = '#F5F0E8',
  opacity = 0.4,
}: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={className}
      style={{ opacity }}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="8" cy="8" r="6" fill="none" stroke={color} strokeWidth="1" />
      <path d="M8 0V16M0 8H16" stroke={color} strokeWidth="1" />
    </svg>
  )
}

/**
 * Compass rose — the Travel style's mark, borrowed from passport stamps.
 */
export function CompassMark({
  size = 22,
  className,
  color = 'var(--secondary)',
}: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="11" cy="11" r="9" fill="none" stroke={color} strokeWidth="1.2" />
      <path d="M11 3V19M3 11H19" stroke={color} strokeWidth="1" />
    </svg>
  )
}

/**
 * Film sprocket holes — the Adventure style's left edge, marking it as a
 * contact strip rather than a card.
 */
export function SprocketRail({
  count = 4,
  className,
  vertical = true,
}: {
  count?: number
  className?: string
  vertical?: boolean
}) {
  return (
    <div
      className={`flex ${vertical ? 'flex-col' : 'flex-row'} gap-2.5 ${className ?? ''}`}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="block h-1.5 w-1.5 rounded-[1px] bg-[#F5F0E8] opacity-40"
        />
      ))}
    </div>
  )
}

/**
 * Places a registration mark at each corner of a positioned parent.
 * The parent must be `relative`.
 */
export function CornerMarks({
  inset = 16,
  color = '#F5F0E8',
  opacity = 0.4,
  size = 16,
}: {
  inset?: number
  color?: string
  opacity?: number
  size?: number
}) {
  return (
    <>
      <div className="pointer-events-none absolute" style={{ top: inset, left: inset }}>
        <RegistrationTarget size={size} color={color} opacity={opacity} />
      </div>
      <div className="pointer-events-none absolute" style={{ top: inset, right: inset }}>
        <TrimCorner size={size} color={color} opacity={opacity} corner="tr" />
      </div>
      <div className="pointer-events-none absolute" style={{ bottom: inset, left: inset }}>
        <TrimCorner size={size} color={color} opacity={opacity} corner="bl" />
      </div>
      <div className="pointer-events-none absolute" style={{ bottom: inset, right: inset }}>
        <RegistrationTarget size={size} color={color} opacity={opacity} />
      </div>
    </>
  )
}
