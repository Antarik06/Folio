import React from 'react'
import { Plus, BookMarked } from 'lucide-react'
import { AlbumSpread } from './types'

interface TimelineProps {
  spreads: AlbumSpread[]
  activeSpreadId: string | null
  activeSide: 'front' | 'back'
  onSelectSpread: (id: string) => void
  onChangeSide: (side: 'front' | 'back') => void
  onAddSpread: () => void
  onAddCoverSpread: () => void
}

export function Timeline({
  spreads,
  activeSpreadId,
  activeSide,
  onSelectSpread,
  onChangeSide,
  onAddSpread,
  onAddCoverSpread,
}: TimelineProps) {
  const hasCover = spreads.some((spread) => spread.isCover)

  return (
    <div className="h-30 bg-white dark:bg-[#171511] border-t border-[#E5E5E5] dark:border-[#3a342b] flex items-center px-6 overflow-x-auto z-10 shrink-0 shadow-[0_-1px_6px_rgba(0,0,0,0.03)] transition-colors">
      
      <div className="flex gap-4 items-center">
        <div className="mb-5.5 mr-1 flex h-8 overflow-hidden rounded border border-border">
          <button
            type="button"
            onClick={() => onChangeSide('front')}
            className={`px-3 text-xs font-semibold tracking-wide ${
              activeSide === 'front'
                ? 'bg-terracotta text-white'
                : 'bg-white text-muted-foreground hover:bg-muted/50'
            }`}
          >
            Front
          </button>
          <button
            type="button"
            onClick={() => onChangeSide('back')}
            className={`px-3 text-xs font-semibold tracking-wide ${
              activeSide === 'back'
                ? 'bg-terracotta text-white'
                : 'bg-white text-muted-foreground hover:bg-muted/50'
            }`}
          >
            Back
          </button>
        </div>

        {spreads.map((spread, i) => {
          const isActive = spread.id === activeSpreadId
          const pageNumber = spreads.slice(0, i + 1).filter((item) => !item.isCover).length
          return (
            <div
              key={spread.id}
              className="flex flex-col items-center gap-2 cursor-pointer group"
              onClick={() => onSelectSpread(spread.id)}
            >
              <div 
                className={`w-30 h-20 rounded flex border-2 transition-all ${
                  isActive 
                    ? 'border-terracotta shadow-[0_0_12px_rgba(184,92,56,0.2)] scale-100' 
                    : 'border-transparent shadow-[0_2px_8px_rgba(0,0,0,0.06)] bg-[#F5F0E8] dark:bg-[#1f1b16] group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] scale-[0.98] group-hover:scale-100'
                }`}
              >
                <div className="w-full h-full bg-white dark:bg-[#f0ece6] rounded flex items-center justify-center">
                  {spread.isCover ? (
                    <BookMarked className="w-4 h-4 text-terracotta" />
                  ) : (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {activeSide}
                    </span>
                  )}
                </div>
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                {spread.isCover ? 'COVER' : `PAGE ${pageNumber}`}
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
      </div>

    </div>
  )
}
