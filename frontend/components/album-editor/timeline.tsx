'use client'

import React from 'react'
import { BookMarked, Copy, Plus, Trash2 } from 'lucide-react'
import { PageThumb } from './page-thumb'
import type { AlbumSpread } from './types'

/**
 * The page rail.
 *
 * It used to be a row of white boxes with the words FRONT and BACK on them,
 * which meant finding a page required remembering its number. Every card now
 * draws the page it stands for, at the real element coordinates, so the rail
 * reads like a flat-plan: you scan it the way you would flick a book.
 */

interface TimelineProps {
  spreads: AlbumSpread[]
  activeSpreadId: string | null
  activeSide: 'front' | 'back'
  pageWidth: number
  pageHeight: number
  onSelectSpread: (id: string, side: 'front' | 'back') => void
  onAddSpread: () => void
  onAddCoverSpread: () => void
  onDuplicateSpread: (id: string) => void
  onDeleteSpread: (id: string) => void
  canDeleteSpread: (id: string) => boolean
  onReorderSpreads: (sourceId: string, targetId: string) => void
}

export function Timeline({
  spreads,
  activeSpreadId,
  activeSide,
  pageWidth,
  pageHeight,
  onSelectSpread,
  onAddSpread,
  onAddCoverSpread,
  onDuplicateSpread,
  onDeleteSpread,
  canDeleteSpread,
  onReorderSpreads,
}: TimelineProps) {
  const hasCover = spreads.some((spread) => spread.isCover)
  const [draggingId, setDraggingId] = React.useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = React.useState<string | null>(null)

  const clearDragState = React.useCallback(() => {
    setDraggingId(null)
    setDropTargetId(null)
  }, [])

  const innerSpreads = spreads.filter((s) => !s.isCover)

  return (
    <div className="shrink-0 border-t border-border bg-card">
      <div className="flex items-center justify-between px-3 pt-2 sm:px-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
          Pages
        </span>
        <span className="hidden font-mono text-[9px] uppercase tracking-[0.08em] text-ink-soft/60 sm:inline">
          Drag a card to reorder
        </span>
      </div>

      <div className="scrollbar-hide flex items-start gap-3 overflow-x-auto px-3 pb-3 pt-2 sm:px-4">
        {spreads.map((spread) => {
          const isActive = spread.id === activeSpreadId
          const canDelete = canDeleteSpread(spread.id)
          const innerIndex = innerSpreads.findIndex((s) => s.id === spread.id)
          const leftPage = innerIndex >= 0 ? (innerIndex + 1) * 2 : null
          const rightPage = innerIndex >= 0 ? (innerIndex + 1) * 2 + 1 : null

          return (
            <div
              key={spread.id}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('text/plain', spread.id)
                setDraggingId(spread.id)
              }}
              onDragOver={(event) => {
                event.preventDefault()
                if (draggingId && draggingId !== spread.id) setDropTargetId(spread.id)
              }}
              onDragLeave={() =>
                setDropTargetId((current) => (current === spread.id ? null : current))
              }
              onDrop={(event) => {
                event.preventDefault()
                const sourceId = draggingId || event.dataTransfer.getData('text/plain')
                if (sourceId && sourceId !== spread.id) onReorderSpreads(sourceId, spread.id)
                clearDragState()
              }}
              onDragEnd={clearDragState}
              className={`group relative shrink-0 cursor-grab active:cursor-grabbing ${
                draggingId === spread.id ? 'opacity-40' : ''
              }`}
            >
              <div
                className={`flex overflow-hidden rounded-[2px] ring-1 transition-all ${
                  isActive ? 'ring-2 ring-primary' : 'ring-border hover:ring-foreground/40'
                } ${
                  dropTargetId === spread.id && draggingId !== spread.id
                    ? 'ring-2 ring-secondary'
                    : ''
                }`}
                style={{ height: 76 }}
              >
                {spread.isCover ? (
                  <PageButton
                    active={isActive}
                    label="Cover"
                    onClick={() => onSelectSpread(spread.id, 'front')}
                    width={pageWidth}
                    height={pageHeight}
                    side={spread.front ?? { background: spread.background, elements: spread.elements }}
                    icon={<BookMarked className="h-3 w-3" />}
                  />
                ) : (
                  <>
                    <PageButton
                      active={isActive && activeSide === 'front'}
                      label={String(leftPage ?? '')}
                      onClick={() => onSelectSpread(spread.id, 'front')}
                      width={pageWidth}
                      height={pageHeight}
                      side={spread.front ?? { background: spread.background, elements: spread.elements }}
                    />
                    <span aria-hidden="true" className="w-px bg-border" />
                    <PageButton
                      active={isActive && activeSide === 'back'}
                      label={String(rightPage ?? '')}
                      onClick={() => onSelectSpread(spread.id, 'back')}
                      width={pageWidth}
                      height={pageHeight}
                      side={spread.back ?? { background: '#ffffff', elements: [] }}
                    />
                  </>
                )}
              </div>

              <div className="mt-1 flex items-center justify-center gap-1">
                <span
                  className={`font-mono text-[9px] uppercase tracking-[0.08em] tabular-nums ${
                    isActive ? 'text-foreground' : 'text-ink-soft'
                  }`}
                >
                  {spread.isCover ? 'Cover' : `${leftPage}–${rightPage}`}
                </span>
              </div>

              {/* Card actions, on hover or focus */}
              <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                <CardAction
                  label="Duplicate page"
                  onClick={() => onDuplicateSpread(spread.id)}
                >
                  <Copy className="h-3 w-3" />
                </CardAction>
                <CardAction
                  label={canDelete ? 'Delete page' : 'At least one page is required'}
                  onClick={() => onDeleteSpread(spread.id)}
                  disabled={!canDelete}
                  destructive
                >
                  <Trash2 className="h-3 w-3" />
                </CardAction>
              </div>
            </div>
          )
        })}

        <button
          type="button"
          onClick={onAddCoverSpread}
          disabled={hasCover}
          title={hasCover ? 'This album already has a cover' : 'Add a cover'}
          className="flex h-[76px] w-[58px] shrink-0 flex-col items-center justify-center gap-1 rounded-[2px] border border-dashed border-border font-mono text-[9px] uppercase tracking-[0.06em] text-ink-soft transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <BookMarked className="h-4 w-4" strokeWidth={1.5} />
          Cover
        </button>

        <button
          type="button"
          onClick={onAddSpread}
          title="Add a page"
          className="flex h-[76px] w-[58px] shrink-0 flex-col items-center justify-center gap-1 rounded-[2px] border border-dashed border-border font-mono text-[9px] uppercase tracking-[0.06em] text-ink-soft transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Page
        </button>
      </div>
    </div>
  )
}

function PageButton({
  active,
  label,
  onClick,
  side,
  width,
  height,
  icon,
}: {
  active: boolean
  label: string
  onClick: () => void
  side: { background: string; elements: any[] }
  width: number
  height: number
  icon?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      className="relative block h-full"
      style={{ width: Math.round(76 * (width / height)) }}
    >
      <PageThumb side={side} width={width} height={height} />
      <span
        className={`pointer-events-none absolute inset-0 transition-colors ${
          active ? 'bg-primary/12' : 'bg-transparent hover:bg-foreground/5'
        }`}
      />
      <span
        className={`pointer-events-none absolute bottom-0 left-0 flex items-center gap-0.5 px-1 py-0.5 font-mono text-[8px] uppercase tracking-[0.06em] tabular-nums ${
          active ? 'bg-primary text-primary-foreground' : 'bg-background/80 text-ink-soft'
        }`}
      >
        {icon}
        {label}
      </span>
    </button>
  )
}

function CardAction({
  children,
  label,
  onClick,
  disabled,
  destructive,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`flex h-6 w-6 items-center justify-center rounded-[2px] border border-border bg-background/95 shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
        destructive ? 'text-ink-soft hover:text-primary' : 'text-ink-soft hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}
