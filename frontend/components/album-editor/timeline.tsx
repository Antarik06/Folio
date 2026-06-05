import React from 'react'
import { Plus, BookMarked, Trash2 } from 'lucide-react'
import { AlbumSpread } from './types'

interface TimelineProps {
  spreads: AlbumSpread[]
  activeSpreadId: string | null
  activeSide: 'front' | 'back'
  onSelectSpread: (id: string) => void
  onChangeSide: (side: 'front' | 'back') => void
  onAddSpread: () => void
  onAddCoverSpread: () => void
  onDeleteSpread: (id: string) => void
  canDeleteSpread: (id: string) => boolean
  onReorderSpreads: (sourceId: string, targetId: string) => void
}

export function Timeline({
  spreads,
  activeSpreadId,
  activeSide,
  onSelectSpread,
  onChangeSide,
  onAddSpread,
  onAddCoverSpread,
  onDeleteSpread,
  canDeleteSpread,
  onReorderSpreads,
}: TimelineProps) {
  const hasCover = spreads.some((spread) => spread.isCover)
  const [draggingSpreadId, setDraggingSpreadId] = React.useState<string | null>(null)
  const [dropTargetSpreadId, setDropTargetSpreadId] = React.useState<string | null>(null)

  const clearDragState = React.useCallback(() => {
    setDraggingSpreadId(null)
    setDropTargetSpreadId(null)
  }, [])

  return (
    <div className="h-30 bg-white dark:bg-[#171511] border-t border-[#E5E5E5] dark:border-[#3a342b] flex items-center px-6 overflow-x-auto z-10 shrink-0 shadow-[0_-1px_6px_rgba(0,0,0,0.03)] transition-colors">
      
      <div className="flex gap-4 items-center">


      {spreads.map((spread, i) => {
        const isActive = spread.id === activeSpreadId
        const canDelete = canDeleteSpread(spread.id)
        const isDragging = draggingSpreadId === spread.id
        const isDropTarget = dropTargetSpreadId === spread.id && draggingSpreadId !== spread.id

        const innerSpreads = spreads.filter((s) => !s.isCover)
        const innerIndex = innerSpreads.findIndex((s) => s.id === spread.id)
        const leftPageNum = innerIndex >= 0 ? (innerIndex + 1) * 2 : null
        const rightPageNum = innerIndex >= 0 ? (innerIndex + 1) * 2 + 1 : null

        return (
          <div
            key={spread.id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'move'
              event.dataTransfer.setData('text/plain', spread.id)
              setDraggingSpreadId(spread.id)
            }}
            onDragOver={(event) => {
              event.preventDefault()
              if (draggingSpreadId && draggingSpreadId !== spread.id) {
                setDropTargetSpreadId(spread.id)
              }
            }}
            onDragLeave={() => {
              setDropTargetSpreadId((current) => (current === spread.id ? null : current))
            }}
            onDrop={(event) => {
              event.preventDefault()
              const sourceId = draggingSpreadId || event.dataTransfer.getData('text/plain')
              if (sourceId && sourceId !== spread.id) {
                onReorderSpreads(sourceId, spread.id)
              }
              clearDragState()
            }}
            onDragEnd={clearDragState}
            className="flex flex-col items-center gap-2 cursor-pointer group relative"
          >
            <div
              className={`w-30 h-20 rounded border-2 transition-all relative overflow-hidden flex ${
                isActive
                  ? 'border-terracotta shadow-[0_0_12px_rgba(184,92,56,0.2)]'
                  : 'border-[#DDD8CE] dark:border-[#3a342b] shadow-[0_2px_8px_rgba(0,0,0,0.06)] bg-white dark:bg-[#1c1814] hover:border-terracotta/40'
              } ${
                isDropTarget ? 'ring-2 ring-terracotta/70 ring-offset-2 ring-offset-transparent' : ''
              } ${
                isDragging ? 'opacity-45' : ''
              }`}
            >
              {spread.isCover ? (
                <div 
                  onClick={() => {
                    onSelectSpread(spread.id)
                    onChangeSide('front')
                  }}
                  className={`w-full h-full flex flex-col items-center justify-center gap-1 transition-colors ${
                    isActive ? 'bg-[#FAF9F6] dark:bg-[#2c2720] text-terracotta' : 'bg-white dark:bg-[#1C1814] text-muted-foreground'
                  }`}
                >
                  <BookMarked className="w-5.5 h-5.5" strokeWidth={1.5} />
                  <span className="text-[9px] font-bold tracking-wider uppercase opacity-80">Cover</span>
                </div>
              ) : (
                <div className="flex w-full h-full">
                  {/* Left Page (Front) */}
                  <div
                    onClick={() => {
                      onSelectSpread(spread.id)
                      onChangeSide('front')
                    }}
                    className={`w-1/2 h-full flex flex-col items-center justify-center gap-1 transition-colors border-r border-[#E5E5E5]/60 dark:border-[#3a342b]/60 ${
                      isActive && activeSide === 'front'
                        ? 'bg-[#FAF9F6] dark:bg-[#2c2720] text-terracotta font-bold'
                        : 'bg-white dark:bg-[#1C1814] text-muted-foreground hover:bg-[#FDFCF7] dark:hover:bg-[#221f1a]'
                    }`}
                  >
                    <span className="text-xs">{leftPageNum}</span>
                    <span className="text-[8px] font-medium tracking-wide uppercase opacity-60">Front</span>
                  </div>

                  {/* Right Page (Back) */}
                  <div
                    onClick={() => {
                      onSelectSpread(spread.id)
                      onChangeSide('back')
                    }}
                    className={`w-1/2 h-full flex flex-col items-center justify-center gap-1 transition-colors ${
                      isActive && activeSide === 'back'
                        ? 'bg-[#FAF9F6] dark:bg-[#2c2720] text-terracotta font-bold'
                        : 'bg-white dark:bg-[#1C1814] text-muted-foreground hover:bg-[#FDFCF7] dark:hover:bg-[#221f1a]'
                    }`}
                  >
                    <span className="text-xs">{rightPageNum}</span>
                    <span className="text-[8px] font-medium tracking-wide uppercase opacity-60">Back</span>
                  </div>
                </div>
              )}

              {/* Delete Button */}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onDeleteSpread(spread.id)
                }}
                disabled={!canDelete}
                className="absolute right-1 top-1 z-20 inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background/95 text-muted-foreground opacity-0 shadow-sm transition group-hover:opacity-100 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-35"
                title={canDelete ? 'Delete page' : 'At least one page is required'}
                aria-label={canDelete ? 'Delete page' : 'Cannot delete the only page'}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <span className={`text-[10px] uppercase font-bold tracking-wider ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
              {spread.isCover ? 'COVER' : `PAGES ${leftPageNum}–${rightPageNum}`}
            </span>
          </div>
        )
      })}

        <button
          onClick={onAddCoverSpread}
          disabled={hasCover}
          className="w-24 h-20 mb-5.5 ml-2 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-[#DDD8CE] dark:border-[#3a342b] rounded bg-transparent hover:bg-[#F5F0E8] dark:hover:bg-[#1f1b16] hover:border-terracotta transition-colors text-muted-foreground group disabled:opacity-50 disabled:cursor-not-allowed"
          title={hasCover ? 'Cover already exists' : 'Add cover page'}
        >
          <BookMarked className="w-5 h-5 stroke-[1.5] group-hover:text-terracotta transition-colors" />
          <span className="text-[10px] font-medium tracking-wide uppercase group-hover:text-terracotta">
            {hasCover ? 'Cover Added' : 'Add Cover'}
          </span>
        </button>

        <button
          onClick={onAddSpread}
          className="w-20 h-20 mb-5.5 ml-2 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-[#DDD8CE] dark:border-[#3a342b] rounded bg-transparent hover:bg-[#F5F0E8] dark:hover:bg-[#1f1b16] hover:border-terracotta transition-colors text-muted-foreground group"
        >
          <Plus className="w-6 h-6 stroke-[1.5] group-hover:text-terracotta transition-colors" />
          <span className="text-[10px] font-medium tracking-wide uppercase group-hover:text-terracotta">Add Page</span>
        </button>

        <span className="mb-5.5 ml-2 text-[10px] uppercase tracking-wide text-muted-foreground/80">Drag page cards to reorder</span>
      </div>

    </div>
  )
}
