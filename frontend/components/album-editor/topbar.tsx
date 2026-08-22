'use client'

import React from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Check,
  Eye,
  Grid3x3,
  Maximize2,
  Minus,
  PanelLeft,
  PanelRight,
  Plus,
  Redo2,
  ShoppingBag,
  Undo2,
} from 'lucide-react'

/**
 * The editor's top bar: the album, never the object.
 *
 * One row, and everything on it acts on the whole album — where you came from,
 * what it is called, whether it is saved, how far in you are zoomed, and the
 * two ways out (proof it, or order it). Controls for whatever is *selected*
 * live in the inspector on the right, which is where you are already looking
 * when you have something in your hand.
 *
 * The old bar mixed the two, so "delete" for a photo sat two pixels from
 * "save" for the book.
 */

interface TopbarProps {
  albumTitle: string
  onRenameAlbum: (title: string) => void
  renaming?: boolean

  zoom: number
  setZoom: (z: number) => void
  onZoomToFit: () => void

  showGrid: boolean
  onToggleGrid: () => void

  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void

  saveLabel: string
  saveTone: 'idle' | 'busy' | 'error'
  saving?: boolean
  onSaveNow: () => void
  onBack: () => void

  albumId: string

  isMobile?: boolean
  onToggleSidebar?: () => void
  onToggleInspector?: () => void
  inspectorOpen?: boolean
  /** Marks the inspector button when there is something to inspect. */
  hasSelection?: boolean
}

export function Topbar({
  albumTitle,
  onRenameAlbum,
  renaming,
  zoom,
  setZoom,
  onZoomToFit,
  showGrid,
  onToggleGrid,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  saveLabel,
  saveTone,
  saving,
  onSaveNow,
  onBack,
  albumId,
  isMobile,
  onToggleSidebar,
  onToggleInspector,
  inspectorOpen,
  hasSelection,
}: TopbarProps) {
  const [editingTitle, setEditingTitle] = React.useState(false)
  const [draft, setDraft] = React.useState(albumTitle)

  React.useEffect(() => {
    setDraft(albumTitle)
  }, [albumTitle])

  function commitTitle() {
    setEditingTitle(false)
    const next = draft.trim()
    if (next && next !== albumTitle) onRenameAlbum(next)
    else setDraft(albumTitle)
  }

  return (
    <div className="@container flex h-14 shrink-0 items-center gap-1.5 border-b border-border bg-card px-2 sm:px-3">
      <IconButton label="Back" onClick={onBack}>
        <ArrowLeft className="h-[18px] w-[18px]" />
      </IconButton>

      {isMobile ? (
        <IconButton label="Panels" onClick={onToggleSidebar}>
          <PanelLeft className="h-[18px] w-[18px]" />
        </IconButton>
      ) : null}

      {/* ── The album ─────────────────────────────────────────────── */}
      {/* flex-1, not mr-auto: as a content-sized item this was the only
          shrinkable thing in the row, so on a laptop the whole title
          collapsed to a single truncated letter. */}
      <div className="flex min-w-[90px] flex-1 items-center gap-2 pl-1">
        {editingTitle ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle()
              if (e.key === 'Escape') {
                setDraft(albumTitle)
                setEditingTitle(false)
              }
            }}
            aria-label="Album title"
            className="min-h-[36px] w-[min(46vw,320px)] rounded-[2px] border border-primary bg-background px-2 font-serif text-base italic text-foreground outline-none sm:text-lg"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingTitle(true)}
            title="Rename album"
            className="min-w-0 max-w-[min(46vw,340px)] truncate rounded-[2px] px-1.5 py-1 text-left font-serif text-base italic text-foreground transition-colors hover:bg-foreground/5 sm:text-lg"
          >
            {albumTitle || 'Untitled album'}
          </button>
        )}

        <span
          role="status"
          aria-live="polite"
          className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.08em] ${
            saveTone === 'error'
              ? 'text-primary'
              : saveTone === 'busy'
                ? 'text-foreground'
                : 'text-ink-soft'
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${
              saveTone === 'error'
                ? 'bg-primary'
                : saveTone === 'busy'
                  ? 'bg-foreground'
                  : 'bg-secondary'
            }`}
          />
          <span className="hidden @[780px]:inline">{renaming ? 'Renaming…' : saveLabel}</span>
        </span>
      </div>

      {/* ── History ───────────────────────────────────────────────── */}
      <IconButton label="Undo" onClick={onUndo} disabled={!canUndo}>
        <Undo2 className="h-[18px] w-[18px]" />
      </IconButton>
      <IconButton label="Redo" onClick={onRedo} disabled={!canRedo}>
        <Redo2 className="h-[18px] w-[18px]" />
      </IconButton>

      <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-border sm:block" />

      {/* ── View ──────────────────────────────────────────────────── */}
      <IconButton label={showGrid ? 'Hide grid' : 'Show grid'} onClick={onToggleGrid} active={showGrid}>
        <Grid3x3 className="h-[18px] w-[18px]" />
      </IconButton>

      <div className="hidden items-center sm:flex">
        <IconButton label="Zoom out" onClick={() => setZoom(Math.max(10, zoom - 10))}>
          <Minus className="h-4 w-4" />
        </IconButton>
        <button
          type="button"
          onClick={onZoomToFit}
          title="Fit to screen"
          className="w-12 rounded-[2px] py-1.5 text-center font-mono text-[11px] tabular-nums text-ink-soft transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          {Math.round(zoom)}%
        </button>
        <IconButton label="Zoom in" onClick={() => setZoom(Math.min(300, zoom + 10))}>
          <Plus className="h-4 w-4" />
        </IconButton>
      </div>

      <IconButton label="Fit to screen" onClick={onZoomToFit} className="sm:hidden">
        <Maximize2 className="h-[18px] w-[18px]" />
      </IconButton>

      {isMobile ? (
        <IconButton
          label={hasSelection ? 'Controls for the selection' : 'Inspector'}
          onClick={onToggleInspector}
          active={inspectorOpen}
        >
          <span className="relative">
            <PanelRight className="h-[18px] w-[18px]" />
            {/* On a phone the inspector is a closed drawer, so a selection
                would otherwise give no sign that its controls exist. */}
            {hasSelection && !inspectorOpen ? (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" />
            ) : null}
          </span>
        </IconButton>
      ) : null}

      <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-border sm:block" />

      {/* ── Out ───────────────────────────────────────────────────── */}
      <Link
        href={`/preview/${albumId}`}
        title="Proof this album"
        className="hidden min-h-[38px] items-center gap-1.5 rounded-[2px] border border-border px-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-foreground hover:text-foreground md:inline-flex @[900px]:px-3"
      >
        <Eye className="h-3.5 w-3.5" />
        <span className="hidden @[900px]:inline">Proof</span>
      </Link>

      <Link
        href={`/create/orders/checkout?albumId=${albumId}`}
        title="Order a print"
        className="hidden min-h-[38px] items-center gap-1.5 rounded-[2px] border border-border px-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-foreground hover:text-foreground md:inline-flex @[900px]:px-3"
      >
        <ShoppingBag className="h-3.5 w-3.5" />
        <span className="hidden @[900px]:inline">Order</span>
      </Link>

      <button
        type="button"
        onClick={onSaveNow}
        disabled={saving}
        className="ml-1 inline-flex min-h-[38px] items-center gap-1.5 rounded-[2px] bg-primary px-4 font-mono text-[11px] uppercase tracking-[0.1em] text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? (
          'Saving…'
        ) : saveTone === 'idle' ? (
          <>
            <Check className="h-3.5 w-3.5" />
            Save
          </>
        ) : (
          'Save'
        )}
      </button>
    </div>
  )
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
  active,
  className,
}: {
  children: React.ReactNode
  label: string
  onClick?: () => void
  disabled?: boolean
  active?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[2px] transition-colors disabled:opacity-30 ${
        active
          ? 'bg-primary/15 text-primary'
          : 'text-ink-soft hover:bg-foreground/5 hover:text-foreground'
      } ${className ?? ''}`}
    >
      {children}
    </button>
  )
}
