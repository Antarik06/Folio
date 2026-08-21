'use client'

import { useEffect, useState } from 'react'

/**
 * The editor's technical stamp.
 *
 * Per the design's Editor screen, the strip above the canvas carries only what
 * a darkroom technician would keep at a light table: which spread, the pixel
 * dimensions it will print at, the DPI, the zoom, and when it last saved. No
 * icon row — the tools live in the rails.
 *
 * This also replaces the floating "Saved 14:32:07" pill that used to hover in
 * the bottom-right corner of the canvas, which was the one piece of chrome
 * permanently covering the artwork.
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
  zoom: number
  saveStatus: SpecSaveStatus
  lastSavedAt: Date | null
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

/**
 * "Saved 2s ago" — relative, because an absolute timestamp reads as data and
 * this is meant to reassure at a glance.
 */
function useRelativeSaved(lastSavedAt: Date | null): string {
  const [, tick] = useState(0)

  useEffect(() => {
    if (!lastSavedAt) return
    const id = window.setInterval(() => tick((n) => n + 1), 5000)
    return () => window.clearInterval(id)
  }, [lastSavedAt])

  if (!lastSavedAt) return 'Not saved yet'

  const seconds = Math.max(0, Math.round((Date.now() - lastSavedAt.getTime()) / 1000))
  if (seconds < 5) return 'Saved just now'
  if (seconds < 60) return `Saved ${seconds}s ago`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `Saved ${minutes}m ago`
  return `Saved ${Math.round(minutes / 60)}h ago`
}

export function SpecStrip({
  spreadIndex,
  spreadCount,
  isCover,
  widthUnits,
  heightUnits,
  pageSizeMm,
  zoom,
  saveStatus,
  lastSavedAt,
}: SpecStripProps) {
  const savedLabel = useRelativeSaved(lastSavedAt)

  const status =
    saveStatus === 'saving'
      ? 'Saving…'
      : saveStatus === 'error'
        ? 'Save failed'
        : saveStatus === 'dirty'
          ? 'Unsaved changes'
          : saveStatus === 'restored'
            ? 'Recovered draft'
            : savedLabel

  const statusTone =
    saveStatus === 'error'
      ? 'text-primary'
      : saveStatus === 'dirty' || saveStatus === 'saving'
        ? 'text-foreground'
        : 'text-ink-soft'

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="flex h-[30px] shrink-0 items-center gap-4 overflow-x-auto border-b border-border bg-card px-3 font-mono text-[10px] uppercase leading-none tracking-[0.05em] text-ink-soft scrollbar-hide sm:gap-5 sm:px-4">
      <span className="shrink-0 text-foreground">
        {isCover ? 'Cover' : `Spread ${pad(spreadIndex)}/${pad(spreadCount)}`}
      </span>
      <span className="shrink-0">{printPixels(widthUnits, heightUnits, pageSizeMm)}</span>
      <span className="shrink-0">{DPI} DPI</span>
      <span className="hidden shrink-0 sm:inline">{Math.round(zoom)}%</span>
      <span
        className={`ml-auto shrink-0 pl-4 ${statusTone}`}
        role="status"
        aria-live="polite"
      >
        {status}
      </span>
    </div>
  )
}
