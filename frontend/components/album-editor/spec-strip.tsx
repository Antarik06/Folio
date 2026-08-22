/**
 * The editor's technical stamp.
 *
 * The strip above the canvas carries only what a technician would keep at a
 * light table: which spread is up, the pixel dimensions it will print at, the
 * DPI, and the trim size. No icon row — the tools live in the rails, and the
 * save state sits beside the Save button in the top bar where the action is,
 * rather than being printed twice.
 */

export type SpecSaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error' | 'restored'

interface SpecStripProps {
  /** 1-based index of the spread on screen. */
  spreadIndex: number
  spreadCount: number
  isCover?: boolean
  /** Workspace units of the spread — converted to print pixels below. */
  widthUnits: number
  heightUnits: number
  /** Physical page size, when the album's schema declares one. */
  pageSizeMm?: { width: number; height: number } | null
}

const DPI = 300
/** Long edge of an album page when the schema doesn't say, in inches. */
const DEFAULT_LONG_EDGE_IN = 12

function printPixels(
  widthUnits: number,
  heightUnits: number,
  pageSizeMm?: { width: number; height: number } | null
): string {
  if (pageSizeMm?.width && pageSizeMm?.height) {
    const w = Math.round((pageSizeMm.width / 25.4) * DPI)
    const h = Math.round((pageSizeMm.height / 25.4) * DPI)
    return `${w}×${h}px`
  }

  // No declared page size: scale the workspace ratio so the long edge lands on
  // a standard 12in album page at 300 DPI.
  const ratio = widthUnits && heightUnits ? widthUnits / heightUnits : 0.7
  const longEdge = DEFAULT_LONG_EDGE_IN * DPI
  const [w, h] =
    ratio >= 1 ? [longEdge, Math.round(longEdge / ratio)] : [Math.round(longEdge * ratio), longEdge]
  return `${w}×${h}px`
}

export function SpecStrip({
  spreadIndex,
  spreadCount,
  isCover,
  widthUnits,
  heightUnits,
  pageSizeMm,
}: SpecStripProps) {
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="scrollbar-hide flex h-[28px] shrink-0 items-center gap-4 overflow-x-auto border-b border-border bg-card px-3 font-mono text-[10px] uppercase leading-none tracking-[0.05em] text-ink-soft sm:gap-5 sm:px-4">
      <span className="shrink-0 text-foreground">
        {isCover ? 'Cover' : `Spread ${pad(spreadIndex)}/${pad(spreadCount)}`}
      </span>
      <span className="shrink-0">{printPixels(widthUnits, heightUnits, pageSizeMm)}</span>
      <span className="shrink-0">{DPI} DPI</span>
      {pageSizeMm ? (
        <span className="hidden shrink-0 sm:inline">
          {Math.round(pageSizeMm.width)}×{Math.round(pageSizeMm.height)}mm trim
        </span>
      ) : null}
      <span className="ml-auto hidden shrink-0 pl-4 text-ink-soft/60 md:inline">
        Bleed 3mm · CMYK
      </span>
    </div>
  )
}
