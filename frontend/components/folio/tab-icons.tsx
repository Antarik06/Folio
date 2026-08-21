/**
 * Tab glyphs drawn in the print language rather than pulled from a generic
 * icon set: Photos is a contact sheet, Create is a crop corner, Profile is the
 * locket circle that anchors every occasion card.
 *
 * Stroke-only, 1.25px, currentColor — so they inherit the active/inactive tab
 * state without a second colour token.
 */

interface GlyphProps {
  size?: number
  className?: string
  active?: boolean
}

export function PhotosGlyph({ size = 22, className, active }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2.5" y="2.5" width="7" height="7" stroke="currentColor" strokeWidth="1.25" fill={active ? 'currentColor' : 'none'} />
      <rect x="12.5" y="2.5" width="7" height="7" stroke="currentColor" strokeWidth="1.25" />
      <rect x="2.5" y="12.5" width="7" height="7" stroke="currentColor" strokeWidth="1.25" />
      <rect x="12.5" y="12.5" width="7" height="7" stroke="currentColor" strokeWidth="1.25" fill={active ? 'currentColor' : 'none'} />
    </svg>
  )
}

export function CreateGlyph({ size = 22, className, active }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* Crop corners */}
      <path d="M6 2.5V15.5H19" stroke="currentColor" strokeWidth="1.25" />
      <path d="M2.5 6H15.5V19" stroke="currentColor" strokeWidth="1.25" />
      {active ? <rect x="6" y="6" width="9.5" height="9.5" fill="currentColor" opacity="0.35" /> : null}
    </svg>
  )
}

export function ProfileGlyph({ size = 22, className, active }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="11" cy="11" r="3.5" stroke="currentColor" strokeWidth="1.25" fill={active ? 'currentColor' : 'none'} />
    </svg>
  )
}

export function StudioGlyph({ size = 22, className }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 18L8 8L12 14L15 10L19 18H3Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <circle cx="15.5" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  )
}
