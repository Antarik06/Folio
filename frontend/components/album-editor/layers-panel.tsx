'use client'

import React from 'react'
import { Eye, EyeOff, Lock, Unlock, ChevronUp, ChevronDown, Layers3 } from 'lucide-react'
import { AlbumElement } from './types'

interface LayersPanelProps {
  elements: AlbumElement[]
  selection: string[]
  onSelect: (ids: string[]) => void
  onRename: (id: string, name: string) => void
  onToggleLock: (id: string) => void
  onToggleHidden: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
}

function inferImageLayerName(src: string) {
  const normalized = src.toLowerCase()

  if (normalized.startsWith('data:image/svg+xml') || normalized.includes('svg+xml')) {
    return 'Graphic Element'
  }

  if (normalized.startsWith('blob:')) {
    return 'Uploaded Photo'
  }

  if (normalized.includes('pixabay.com')) {
    return 'Stock Image'
  }

  if (normalized.includes('/storage/v1/object') || normalized.includes('supabase')) {
    return 'Event Photo'
  }

  return 'Image Layer'
}

function getDefaultName(el: AlbumElement) {
  if (el.type === 'text') {
    const snippet = el.text?.trim().slice(0, 24)
    return snippet ? `Text: ${snippet}` : 'Text Layer'
  }
  if (el.type === 'image') {
    return inferImageLayerName(el.src)
  }
  if (el.type === 'drawing') {
    return 'Freehand Sketch'
  }
  if (el.type === 'shape') {
    return `${el.shapeType[0].toUpperCase()}${el.shapeType.slice(1)} Layer`
  }
  return 'Layer'
}

export function LayersPanel({
  elements,
  selection,
  onSelect,
  onRename,
  onToggleLock,
  onToggleHidden,
  onMoveUp,
  onMoveDown,
}: LayersPanelProps) {
  const ordered = [...elements].sort((a, b) => b.zIndex - a.zIndex)
  const [movedLayerId, setMovedLayerId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!movedLayerId) return

    const timer = window.setTimeout(() => {
      setMovedLayerId(null)
    }, 260)

    return () => window.clearTimeout(timer)
  }, [movedLayerId])

  const handleMoveLayer = React.useCallback(
    (id: string, direction: 'up' | 'down') => {
      setMovedLayerId(id)
      if (direction === 'up') onMoveUp(id)
      else onMoveDown(id)
    },
    [onMoveDown, onMoveUp]
  )

  return (
    <aside className="w-75 border-l border-[#E5E5E5] dark:border-[#3a342b] bg-white dark:bg-[#171511] h-full overflow-y-auto p-3 shrink-0">
      <div className="flex items-center gap-2 px-1 py-2 mb-2">
        <Layers3 className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Layers</h3>
      </div>

      {ordered.length === 0 ? (
        <div className="text-xs text-muted-foreground border border-dashed border-border rounded p-3 text-center">
          Add elements to manage layers.
        </div>
      ) : (
        <div className="space-y-2">
          {ordered.map((el, index) => {
            const isSelected = selection.includes(el.id)
            const layerName = el.name?.trim() || getDefaultName(el)
            const canMoveUp = index > 0
            const canMoveDown = index < ordered.length - 1
            const stackLabel =
              index === 0 ? 'Front' : index === ordered.length - 1 ? 'Back' : 'Middle'

            return (
              <div
                key={el.id}
                className={`rounded border p-2 ${
                  isSelected
                    ? 'border-terracotta/60 bg-terracotta/10'
                    : 'border-border bg-card hover:border-terracotta/40'
                } ${movedLayerId === el.id ? 'ring-1 ring-terracotta/70' : ''} transition-all`}
              >
                <button
                  type="button"
                  onClick={() => onSelect([el.id])}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {el.type}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="rounded-full px-1.5 py-0.5 bg-muted">{stackLabel}</span>
                      <span>z{el.zIndex}</span>
                    </div>
                  </div>
                </button>

                <input
                  value={layerName}
                  onChange={(event) => onRename(el.id, event.target.value)}
                  onFocus={() => onSelect([el.id])}
                  className="mt-1 w-full text-sm bg-transparent border border-transparent focus:border-border rounded px-1 py-0.5 outline-none"
                />

                <div className="mt-2 flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => onToggleHidden(el.id)}
                    className="p-1.5 rounded hover:bg-muted"
                    title={el.hidden ? 'Show layer' : 'Hide layer'}
                  >
                    {el.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleLock(el.id)}
                    className="p-1.5 rounded hover:bg-muted"
                    title={el.locked ? 'Unlock layer' : 'Lock layer'}
                  >
                    {el.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMoveLayer(el.id, 'up')}
                    disabled={!canMoveUp}
                    className="p-1.5 rounded hover:bg-muted disabled:opacity-35 disabled:cursor-not-allowed"
                    title="Move forward"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMoveLayer(el.id, 'down')}
                    disabled={!canMoveDown}
                    className="p-1.5 rounded hover:bg-muted disabled:opacity-35 disabled:cursor-not-allowed"
                    title="Move backward"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </aside>
  )
}
