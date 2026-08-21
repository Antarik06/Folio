'use client'

import React from 'react'
import {
  Undo2,
  Redo2,
  Trash2,
  PanelLeft,
  Image as ImageIcon,
  Crop,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Plus,
} from 'lucide-react'
import type { AlbumElement } from './types'

/**
 * The editor's top bar.
 *
 * Rebuilt around one rule: nothing appears until you select something. The old
 * bar carried align, distribute, flip, grid, layers, formatting and a
 * simple/advanced toggle permanently, so the controls for the thing you were
 * holding were buried among controls for things you were not.
 *
 * Now the top row is just the album: back, undo/redo, zoom, save. A second row
 * appears only when a photo or a piece of text is selected, and carries exactly
 * that object's controls — the way CapCut or iLovePDF surface tools.
 */

const FONTS = [
  { label: 'Serif', value: 'serif' },
  { label: 'Sans', value: 'sans-serif' },
  { label: 'Mono', value: 'monospace' },
]

const TEXT_COLOURS = ['#1C1814', '#FDFAF5', '#B85C38', '#3A7D6E', '#7A6F64']

interface TopbarProps {
  albumTitle?: string
  zoom: number
  setZoom: (z: number) => void
  selectedElements: AlbumElement[]
  onUpdateElement: (id: string, partial: Partial<AlbumElement>, options?: { historyGroup?: string }) => void
  onDeleteSelected: () => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onSaveNow: () => void
  saving?: boolean
  /** Opens the Photos panel so a different picture can be chosen. */
  onReplacePhoto?: () => void
  isMobile?: boolean
  onToggleSidebar?: () => void
}

export function Topbar({
  albumTitle,
  zoom,
  setZoom,
  selectedElements,
  onUpdateElement,
  onDeleteSelected,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSaveNow,
  saving,
  onReplacePhoto,
  isMobile,
  onToggleSidebar,
}: TopbarProps) {
  const single = selectedElements.length === 1 ? selectedElements[0] : null
  const image = single?.type === 'image' ? single : null
  const text = single?.type === 'text' ? single : null

  return (
    <div className="shrink-0 border-b border-border bg-card">
      {/* ── Always: the album ────────────────────────────────────────── */}
      <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
        {isMobile ? (
          <IconButton label="Panels" onClick={onToggleSidebar}>
            <PanelLeft className="h-[18px] w-[18px]" />
          </IconButton>
        ) : null}

        <span className="mr-auto truncate font-serif text-base italic text-foreground sm:text-lg">
          {albumTitle || 'Untitled album'}
        </span>

        <IconButton label="Undo" onClick={onUndo} disabled={!canUndo}>
          <Undo2 className="h-[18px] w-[18px]" />
        </IconButton>
        <IconButton label="Redo" onClick={onRedo} disabled={!canRedo}>
          <Redo2 className="h-[18px] w-[18px]" />
        </IconButton>

        <div className="mx-1 hidden items-center gap-1 sm:flex">
          <IconButton label="Zoom out" onClick={() => setZoom(Math.max(20, zoom - 10))}>
            <Minus className="h-4 w-4" />
          </IconButton>
          <span className="w-11 text-center font-mono text-[11px] tabular-nums text-ink-soft">
            {Math.round(zoom)}%
          </span>
          <IconButton label="Zoom in" onClick={() => setZoom(Math.min(300, zoom + 10))}>
            <Plus className="h-4 w-4" />
          </IconButton>
        </div>

        <button
          type="button"
          onClick={onSaveNow}
          disabled={saving}
          className="ml-1 inline-flex min-h-[40px] items-center rounded-[2px] bg-primary px-4 font-mono text-[11px] uppercase tracking-[0.1em] text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* ── Only when something is selected ──────────────────────────── */}
      {single ? (
        <div className="flex min-h-[52px] flex-wrap items-center gap-2 border-t border-border bg-surface-2 px-3 py-2 sm:px-4">
          <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.1em] text-primary">
            {image ? 'Photo' : text ? 'Text' : 'Shape'}
          </span>

          {/* Photo controls */}
          {image ? (
            <>
              <BarButton onClick={() => onReplacePhoto?.()} icon={<ImageIcon className="h-4 w-4" />}>
                Replace
              </BarButton>
              <BarButton
                onClick={() =>
                  onUpdateElement(image.id, {
                    fitMode: (image as any).fitMode === 'fill' ? 'fit' : 'fill',
                  })
                }
                icon={<Crop className="h-4 w-4" />}
              >
                {(image as any).fitMode === 'fill' ? 'Fill' : 'Fit'}
              </BarButton>
            </>
          ) : null}

          {/* Text controls */}
          {text ? (
            <>
              <select
                value={(text as any).fontFamily || 'serif'}
                onChange={(e) => onUpdateElement(text.id, { fontFamily: e.target.value } as any)}
                aria-label="Font"
                className="min-h-[36px] rounded-[2px] border border-border bg-background px-2 text-[13px] text-foreground outline-none focus:border-primary"
              >
                {FONTS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1">
                <IconButton
                  label="Smaller"
                  onClick={() =>
                    onUpdateElement(text.id, {
                      fontSize: Math.max(8, ((text as any).fontSize || 16) - 4),
                    } as any)
                  }
                >
                  <Minus className="h-4 w-4" />
                </IconButton>
                <span className="w-8 text-center font-mono text-[11px] tabular-nums text-ink-soft">
                  {(text as any).fontSize || 16}
                </span>
                <IconButton
                  label="Bigger"
                  onClick={() =>
                    onUpdateElement(text.id, {
                      fontSize: Math.min(160, ((text as any).fontSize || 16) + 4),
                    } as any)
                  }
                >
                  <Plus className="h-4 w-4" />
                </IconButton>
              </div>

              <div className="flex items-center gap-0.5">
                {(
                  [
                    ['left', AlignLeft],
                    ['center', AlignCenter],
                    ['right', AlignRight],
                  ] as const
                ).map(([mode, Icon]) => (
                  <IconButton
                    key={mode}
                    label={`Align ${mode}`}
                    active={(text as any).textAlign === mode}
                    onClick={() => onUpdateElement(text.id, { textAlign: mode } as any)}
                  >
                    <Icon className="h-4 w-4" />
                  </IconButton>
                ))}
              </div>

              <div className="flex items-center gap-1">
                {TEXT_COLOURS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onUpdateElement(text.id, { fill: c } as any)}
                    aria-label={`Text colour ${c}`}
                    title={c}
                    className={`h-6 w-6 rounded-full ring-1 ring-inset transition-all ${
                      (text as any).fill?.toUpperCase() === c.toUpperCase()
                        ? 'ring-2 ring-primary'
                        : 'ring-border hover:ring-foreground'
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </>
          ) : null}

          <button
            type="button"
            onClick={onDeleteSelected}
            className="ml-auto inline-flex min-h-[36px] items-center gap-1.5 rounded-[2px] border border-border px-3 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft transition-colors hover:border-primary hover:text-primary"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      ) : null}
    </div>
  )
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode
  label: string
  onClick?: () => void
  disabled?: boolean
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`flex h-9 w-9 items-center justify-center rounded-[2px] transition-colors disabled:opacity-30 ${
        active ? 'bg-primary/15 text-primary' : 'text-ink-soft hover:bg-foreground/5 hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

function BarButton({
  children,
  icon,
  onClick,
}: {
  children: React.ReactNode
  icon: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[2px] border border-border bg-background px-3 font-mono text-[11px] uppercase tracking-[0.08em] text-foreground transition-colors hover:border-primary hover:text-primary"
    >
      {icon}
      {children}
    </button>
  )
}
